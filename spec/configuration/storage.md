# Test Plan: Configuration — Backup Storage (Object / File)

- **App section:** `/configuration/mystorage` (tabs: Object storage, File storage)
- **Seed:** `seed.spec.ts` (fixture: `fixtures/auth.ts` → `loggedInPage`)
- **Docs:** CloudCasa → Storage configuration
- **Customer evidence (Jira):** ~16 support tickets — the single highest-value UI-testable area.
  Storage add/validate failures block the _first backup_, disproportionately hurting trials and POCs:
  - CC-763 — "Error in accessing bucket" on a custom S3 server with valid permissions
  - CC-659→663 (GBM POC) — path-style vs host-style endpoint URL, trailing slash, port handling rejected in GUI while the same bucket works from the MinIO client
  - CC-770 — green reachability checkmark not shown even though S3 is reachable (appears only when a proxy cluster exists)
  - CC-646, CC-701, CC-607, CC-499, CC-516, CC-689 — further add/validate/delete failures

Observed UI: Backup storage page with Object storage / File storage tabs, table (Name, Provider, Bucket
name, Region, Endpoint, Status, Cluster), "Add storage" button. "Add object storage" wizard steps:
**General → Provider → Summary**. General: "Is your storage isolated/restricted from Internet access?"
(Yes/No) + optional "Select proxy cluster". Provider: Provider type (AWS / S3 (compatible), Azure), Bucket
name*, Endpoint URL*, Region, "Disable TLS certificate validation" checkbox, Access key*, Secret key*,
Advanced options.

> Reachability/validate tests need an S3-compatible target. Recommended: run **MinIO in a container**
> during CI (or a dedicated staging bucket) so both success and failure states are reproducible.
> Cases needing it are marked **[needs S3 target]**. Form/parsing cases run without any backend.

---

## TC-STG-001 — Add object storage wizard: structure and required-field gating 🔴 CRITICAL — 🟨 Partial

**Test:** `tests/storage/object-storage-rejects-invalid-targets.spec.ts` — covered as steps on the way to
the save (tabs, table columns, wizard steps, Summary disabled until valid, Next gated on the required
fields, dismissing the wizard creates nothing). Step 4 (isolated radio defaults to "No", proxy cluster
optional) is not asserted — it belongs with TC-STG-006.

**Steps:**

1. Log in, navigate to `/configuration/mystorage`
2. Verify tabs Object storage / File storage and table columns: Name, Provider, Bucket name, Region, Endpoint, Status, Cluster
3. Click "Add storage" — verify wizard "Add object storage" with steps General, Provider, Summary
4. General step: verify isolated-storage radio defaults to "No", proxy cluster selection is optional; click Next
5. Provider step: verify "AWS / S3 (compatible)" is pre-selected; verify Next/Save stay disabled until Bucket name, Endpoint URL, Access key and Secret key are filled
6. Fill all required fields — verify Next/Save become enabled
7. Cancel

**Expected:** Wizard gates on required fields per provider; cancel creates nothing.

## TC-STG-002 — Endpoint URL format matrix is accepted (CC-659→663) 🔴 CRITICAL — 🟡 Blocked (endpoint format validation missing)

**Test:** `tests/storage/object-storage-rejects-invalid-targets.spec.ts` — all six accepted variants are
driven through the Provider step and the endpoint is verified on Summary. The negative half is covered by
`tests/storage/object-storage-refuses-a-bad-endpoint.spec.ts` (marked `test.fixme()` — see the test's
step comment): the Endpoint URL field never shows a validation message and "Next" never disables for text
that is not a URL at all (a value with a space, a scheme with no host) — the wizard carries it straight
through to Summary instead of refusing it.

The GUI must accept every endpoint format the S3 ecosystem uses. Regression source: GBM POC thread.

**Steps:** for each endpoint variant, fill the Provider step with the variant plus valid bucket/keys and
verify the wizard accepts it (no client-side rejection; reaches Summary):

1. Host only: `s3.example.com`
2. With scheme: `https://s3.example.com` and `http://s3.example.com`
3. With custom port: `https://s3.example.com:9000` (MinIO default)
4. With trailing slash: `https://s3.example.com:9000/`
5. Path-style base (endpoint without bucket) + Bucket name field filled separately
6. IP address endpoint: `https://192.168.1.10:9000`

**Expected:** No variant is rejected at the form level; normalized value shown on the Summary step.
Invalid strings (spaces, no host) DO produce a validation error.

## TC-STG-003 — Add S3-compatible storage succeeds end-to-end (CC-763) 🔴 CRITICAL — 🟨 Partial

**Test:** `tests/storage/adds-object-storage.spec.ts` — data-driven: one generated test per entry of
every provider catalog in `data/storage.ts`, so a new target is a catalog entry plus its credentials in
the environment (`<PREFIX>_ACCESS_KEY` / `<PREFIX>_SECRET_KEY` for S3). Entries without credentials are skipped,
which keeps a CI run green before the credentials are wired. Steps 1–2 are covered plus a reload (the row
is persisted, not just appended client-side) and the removal from TC-STG-009. Step 3 is **not** covered —
see below.

**Precondition:** reachable S3 bucket with valid credentials. Two catalog entries: the staging AWS bucket
`cloudcasa-staging-testbucket` (`us-east-1`) and the DataCore demo endpoint (`cc-dv-test`), which the backend
lists as provider `datacore` even though the wizard fills it through the AWS/S3 radio.

**Steps:**

1. Complete the wizard: General (not isolated) → Provider (S3-compatible, bucket, endpoint, keys) → Summary → Save
2. Verify the storage appears in the table with correct Name, Provider, Bucket name, Endpoint
3. Verify Status becomes reachable/OK (not stuck in error) within the expected time

**Expected:** Storage added and validated; no "Error in accessing bucket" for valid permissions.

A 2xx on `POST /api/v1/objectstores` is what the test asserts as "validated": the same call answers 422
for an unreachable endpoint or unusable keys (TC-STG-004), so 201 is the backend reporting it reached the
bucket with these credentials. Step 3 asks for something else and cannot pass in this environment — see
TC-STG-005.

The backend keys storage uniqueness on **provider type + region + prefix + bucket**, not on the name, so
one bucket holds one storage at a time: the same target cannot be added twice concurrently (`--repeat-each`
on this file fails by design), and a leftover from a run that died before teardown would 422 every later
run. Hence the API arrange step that drops stale `aqa-` storages on the target's bucket first.

## TC-STG-004 — Validation failure states are explicit and actionable (CC-763) 🔴 CRITICAL — 🟨 Partial

**Tests:** `tests/storage/object-storage-rejects-invalid-targets.spec.ts` (unreachable endpoint) and
`tests/storage/object-storage-reports-credentials-failure.spec.ts` (reachable endpoint, unusable keys).
Both assert HTTP 422 on `POST /api/v1/objectstores` plus a cause-specific notification. Step 2
(non-existent bucket) still needs valid S3 credentials — without them it cannot be told apart from a
credentials failure. The `[needs S3 target]` marker was wrong for the other two modes: a dead hostname
needs no infrastructure, and a public endpoint plus invalid keys covers the credentials path.

Verified while automating: the wizard **does** stay open with the input intact after a rejection
(step 4), so no defect there.

**Steps:** repeat the add flow with each broken input and capture the error state:

1. Wrong secret key → expect an authentication-specific error, not a generic one
2. Non-existent bucket → expect bucket-not-found error
3. Unreachable endpoint (valid format, nothing listening) → expect connectivity error
4. Verify in each case the wizard stays open and fields remain editable (no silent failure, no lost input)

**Expected:** Each failure mode yields a distinct, human-readable message; no dead-end states.

## TC-STG-005 — Reachability indicator (green checkmark) shown without proxy cluster (CC-770) 🔴 CRITICAL [needs a connected cluster] — ⬜ To automate

Known status-indicator bug: checkmark only rendered when a proxy cluster exists.

**Steps:**

1. Add a reachable, non-isolated S3 storage **without** selecting a proxy cluster
2. Open the storage list / detail
3. Verify the reachability status indicator is displayed and positive

**Expected:** Status indicator reflects actual reachability regardless of proxy-cluster presence.

Measured while automating TC-STG-003 against the staging AWS bucket: after a 201 create the Status cell
and the badge next to the name both stay **empty**, and the resource sits at `validate_state: VALIDATING`
— still VALIDATING 15 minutes later. The staging org has **zero connected clusters**, and nothing else
runs that asynchronous validation, so this is not evidence of CC-770: it cannot be told apart from "no
agent available to validate". Automating this case needs a connected cluster first, hence the changed
marker. Until then no test may assert a positive Status.

## TC-STG-006 — Isolated storage requires a proxy cluster 🟡 High — ⬜ To automate

**Steps:**

1. In the wizard's General step select "Yes" (isolated/restricted from Internet)
2. Verify a proxy cluster becomes mandatory (Next blocked until one is selected)

**Expected:** Isolated storage cannot be created without an agent-managed proxy cluster.

## TC-STG-007 — Azure provider swaps the field set 🟡 High — ✅ Automated

**Test:** `tests/storage/adds-object-storage.spec.ts` (Azure entry) covers steps 1–2 on the way to the
save: the provider switch and the Azure field set are what the whole flow is filled through, and the
switch is now explicit for every provider rather than relying on AWS being preselected.
`tests/storage/provider-switch-clears-the-fields.spec.ts` covers step 3: it fills the S3 form, switches to
Azure and back, and asserts the S3 fields come back empty (not the values typed before the switch, and
nothing leaked from the Azure form) with the "Next" gating reset, before filling and saving the S3 form
again.

**Steps:**

1. On the Provider step switch Provider type to "Azure"
2. Verify S3 fields are replaced by Azure-specific ones and required-field gating still applies
3. Switch back to AWS/S3 — verify previously entered values behave sanely (no cross-provider leakage)

**Expected:** Provider switch re-renders the correct fields; no stale validation state.

## TC-STG-008 — Disable TLS certificate validation checkbox ⚪ Medium — ⬜ To automate

Self-signed MinIO/FreeNAS installs depend on it.

**Steps:**

1. Verify the checkbox is off by default
2. Toggle it on, complete the wizard [needs S3 target with self-signed cert to verify effect]
3. Verify the setting is reflected on the Summary step

**Expected:** Option persists through the wizard and onto the saved storage.

## TC-STG-009 — Delete storage (CC-646 family) 🟡 High — ✅ Automated

**Test:** `tests/storage/adds-object-storage.spec.ts` — the tail of the happy path, on the storage that
test just created. The action is named **Remove** (not Delete) and its confirmation is a MatDialog whose
title names the storage, which is what proves it belongs to the row that was clicked.

**Steps:**

1. With a disposable storage present, open its actions, choose Delete
2. Verify confirmation dialog; confirm
3. Verify the row disappears and no orphan entry remains after reload

**Expected:** Deletion needs confirmation and completes cleanly.

## TC-STG-010 — File storage tab: add NFS storage 🟡 High [needs NFS target] — ⬜ To automate

FreeNAS/NFS failures are part of the same ticket cluster.

**Steps:**

1. Switch to the "File storage" tab, click "Add storage"
2. Verify NFS-specific fields (server, export path) with required-field gating
3. [with target] Save and verify listing + status

**Expected:** File-storage wizard validates and saves like object storage.

## TC-STG-011 — Add Azure blob storage succeeds end-to-end 🟡 High — ✅ Automated

**Test:** `tests/storage/adds-object-storage.spec.ts` — the Azure entry of the merged catalog, the same test
body as TC-STG-003, running green against the staging storage account since 2026-08-24. The form offers no
authentication other than a service principal and asks for no container, so the account-key model this case
was first written for no longer exists in the GUI. Two values are entered as the form offers them and
asserted as the backend echoes them: the region ("East US" selected, `eastus` listed) and the provider.

**Precondition:** Azure storage account in a known resource group, plus a service principal with access to it.

**Steps:**

1. Complete the wizard: General (not isolated) → Provider (Azure, cloud, resource group, storage account, subscription, region, service principal) → Summary → Save
2. Verify the storage is listed with correct Name, Provider and Region
3. Reload and verify the row is persisted, then remove it and verify no orphan row remains
