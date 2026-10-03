# Test Plan: Clusters — Overview & Add Cluster

- **App section:** `/clusters` (sub-nav: Overview, Backups, Restores, Migration, Replication, Recovery points)
- **Seed:** `seed.spec.ts` (fixture: `fixtures/auth.ts` → `loggedInPage`)
- **Docs:** CloudCasa → Cluster management (add/edit/delete), agent installation

Observed UI: clusters table (Name, Kubernetes version, Agent version, Nodes, State, Last updated), Name
filter, State filter, "Add cluster" button. Add Cluster dialog: Name (required), Description, tags
(key:value), "Enable CloudCasa DR" checkbox (disabled on free plan), Advanced options, Cancel /
Register (disabled until valid).

> Note: full agent-install E2E requires a live Kubernetes cluster — out of scope for UI automation.
> UI-level cases below are automatable against the staging org without a cluster.

---

## TC-CL-001 — Clusters page renders with sub-navigation 🟡 High — ⬜ To automate

**Steps:**

1. Log in, navigate to `/clusters`
2. Verify sub-nav links: Overview, Backups, Restores, Migration, Replication, Recovery points
3. Verify table columns: Name, Kubernetes version, Agent version, Nodes, State, Last updated
4. Verify "Add cluster" button is visible

**Expected:** Page loads with the full sub-navigation and table (or empty state).

## TC-CL-002 — Add Cluster dialog: open, validate, cancel 🔴 CRITICAL — ✅ Automated

**Test:** `tests/clusters/register-a-cluster-and-remove-it.spec.ts` (covers the open/validate
steps 1-5; the dialog is registered rather than cancelled, as part of the same flow as
TC-CL-003/005/007)

Cluster registration is the entry point of the whole product.

**Steps:**

1. On `/clusters` click "Add cluster"
2. Verify dialog "Add Cluster" opens with fields: Name (required), Description, tags key:value
3. Verify "Register" button is disabled while Name is empty
4. Fill Name with a valid value — verify "Register" becomes enabled
5. Clear Name — verify "Register" is disabled again
6. Click "Cancel"

**Expected:** Validation gates the Register button; Cancel closes the dialog without creating a cluster.

## TC-CL-003 — Register cluster shows agent install instructions 🔴 CRITICAL — ✅ Automated

**Test:** `tests/clusters/register-a-cluster-and-remove-it.spec.ts`

**Steps:**

1. Open "Add cluster", fill Name (unique, e.g. `aqa-cluster-<timestamp>`) and Description
2. Click "Register"
3. Verify the agent installation instructions appear (kubectl/helm command containing a cluster-specific ID)
4. Verify the new cluster appears in the clusters table in "Pending"/not-connected state
5. Cleanup: delete the created cluster

**Expected:** Cluster object is created; install command is generated; cluster listed with correct state.

## TC-CL-008 — Generated install manifest contract test 🔴 CRITICAL — ✅ Automated

**Test:** `tests/clusters/install-manifest-holds-the-pull-secret.spec.ts`

**Customer evidence (Jira):** CC-549/550/551 — agent install fails out of the box with
`ErrImagePull` / `ImagePullBackOff … authentication required` from azurecr.io because the
dashboard-generated YAML manifest is missing `imagePullSecret`; CC-811 — agent image tag not found in
the registry. The manifest is an artifact the UI produces — snapshot/contract-test it.

**Steps:**

1. Register a disposable cluster (as in TC-CL-003) and capture the generated install manifest / YAML (download or copy from the instructions)
2. Parse the YAML and assert the contract:
   - `imagePullSecrets` is present on the agent pod spec (or the referenced Secret is included in the manifest)
   - the agent image reference (registry/repository:tag) is well-formed and non-empty
3. Verify the referenced image tag exists in the public registry (HTTP check of the registry manifest endpoint — no cluster needed)
4. Cleanup: delete the cluster

**Expected:** Generated manifest always contains the pull secret and a resolvable agent image tag.

## TC-CL-004 — Add Cluster via deep link `?new=true` ⚪ Medium — 🟡 Blocked (Add Cluster dialog defect)

**Test:** `tests/dashboard/shortcuts-open-their-targets.spec.ts` (marked `test.fixme()` — see the test's last step comment)

**Steps:**

1. Navigate directly to `/clusters?new=true`
2. Verify the Add Cluster dialog is open on page load

**Expected:** Deep link opens the dialog (used by the dashboard shortcut).

**Blocker:** the Add Cluster dialog never opens on staging, whether triggered by this deep link
or by the in-page "Add cluster" button on `/clusters` — the defect is in the dialog itself, not
the link. The URL settles on `/clusters/overview` with no dialog.

## TC-CL-005 — Enable CloudCasa DR is gated by service plan ⚪ Medium — ✅ Automated

**Test:** `tests/clusters/register-a-cluster-and-remove-it.spec.ts`

**Steps:**

1. Open the Add Cluster dialog on a free-plan organization
2. Verify the "Enable CloudCasa DR" checkbox is disabled

**Expected:** DR option unavailable on the free plan (upsell behavior).

## TC-CL-006 — Clusters table filtering by name and state ⚪ Medium — ⬜ To automate

**Precondition:** at least one registered cluster (can be created via TC-CL-003 API/UI).

**Steps:**

1. Type an existing cluster name into the "Name" filter — verify only matching rows remain
2. Type a non-existent name — verify empty state
3. Filter by "State" — verify rows match the selected state
4. Clear filters — verify the full list returns

**Expected:** Filters work independently and combined.

## TC-CL-007 — Delete cluster with confirmation 🟡 High — 🟡 Blocked (confirmation names no resource)

**Test:** `tests/clusters/register-a-cluster-and-remove-it.spec.ts` (steps 1-18 pass; marked
`test.fixme()` at step 19 — see the test's step 19 comment)

**Precondition:** a disposable registered cluster exists.

**Steps:**

1. Open the cluster's actions menu, choose Delete/Remove
2. Verify a confirmation dialog appears (destructive action must be confirmed)
3. Confirm deletion
4. Verify the cluster disappears from the table

**Expected:** Cluster removed only after explicit confirmation.

**Blocker:** the confirmation is CloudCasa's generic "Do you want to proceed?" popover (see
`ProceedConfirmation`), shared with policy row actions — it never names the resource it will
remove. Steps 3-4 are not exercised through the UI past that point; the cluster is still removed
through the `createdClusters` API teardown fixture.
