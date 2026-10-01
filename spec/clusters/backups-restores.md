# Test Plan: Cluster Backups, Restores & Recovery Points

- **App section:** `/clusters/backups`, `/clusters/restores`, `/clusters/recovery-points`
- **Seed:** `seed.spec.ts` (fixture: `fixtures/auth.ts` → `loggedInPage`)
- **Docs:** CloudCasa → Backup wizard, Restore wizard, Recovery points

Observed UI: Backups table (Backup name, Cluster, Policy, Last run, Last 3 runs), "Define backup" button.
"Define cluster backup" wizard steps: **Cluster → Selections → App hooks (optional) → Policy (optional) →
Summary**, with Next/Create disabled until a cluster is selected.

> Backup/restore execution E2E (data actually moved) requires a connected Kubernetes cluster.
> Wizard/UI validation cases are automatable without one; execution cases are marked **[needs live cluster]**.

---

## TC-BAK-001 — Define backup wizard: structure and gating 🔴 CRITICAL — ⬜ To automate

Backup definition is the core value path of the product.

**Steps:**

1. Log in, navigate to `/clusters/backups`
2. Click "Define backup"
3. Verify wizard "Define cluster backup" opens with steps: Cluster, Selections, App hooks (optional), Policy (optional), Summary
4. Verify steps 2–5 are disabled while no cluster is selected
5. Verify "Next" and "Create" buttons are disabled
6. Click "Cancel" — wizard closes without creating anything

**Expected:** Wizard cannot advance without selecting a cluster; cancel is safe.

## TC-BAK-002 — Define backup end-to-end (full wizard pass) 🔴 CRITICAL [needs live cluster] — ⬜ To automate

**Precondition:** at least one connected (Active) cluster in the organization.

**Steps:**

1. Open the "Define backup" wizard
2. Step Cluster: select the test cluster, click Next
3. Step Selections: choose "Full cluster" (or select specific namespaces), click Next
4. Step App hooks: skip (optional), click Next
5. Step Policy: choose "Run on demand" / skip policy, click Next
6. Step Summary: fill backup name `aqa-backup-<timestamp>`, verify summary reflects selections, click Create
7. Verify the backup appears in the Backups table with the correct Cluster and Policy columns

**Expected:** Backup definition created and listed.

## TC-BAK-003 — Run backup on demand and verify job status 🔴 CRITICAL [needs live cluster] — ⬜ To automate

**Precondition:** backup definition from TC-BAK-002 exists.

**Steps:**

1. In the Backups table run the backup (action "Run now")
2. Verify a job appears in "In progress" / dashboard Activity tab
3. Wait for completion
4. Verify job status is "Successful" and "Last run" column updates
5. Verify a recovery point appears under `/clusters/recovery-points`

**Expected:** Backup completes successfully and produces a recovery point.

## TC-BAK-004 — Backups table filter and empty state ⚪ Medium — ⬜ To automate

**Steps:**

1. Navigate to `/clusters/backups`
2. Verify columns: Backup name, Cluster, Policy, Last run, Last 3 runs
3. Type a non-existent name in the "Backup name" filter — verify empty state
4. Clear the filter

**Expected:** Filtering works; empty state is user-friendly.

## TC-BAK-005 — Deep link `/clusters/backups?new=true` opens the wizard ⚪ Medium — ✅ Automated

**Test:** `tests/dashboard/shortcuts-open-their-targets.spec.ts`

**Steps:**

1. Navigate directly to `/clusters/backups?new=true`
2. Verify the "Define cluster backup" wizard is open

**Expected:** Deep link works (dashboard shortcut target).

Note: the `?new=true` query is consumed the instant the wizard opens and disappears from the URL
right after — the test races a `waitForURL` against the click to observe it before it's cleared.

## TC-RST-001 — Restore from a recovery point 🔴 CRITICAL [needs live cluster] — ⬜ To automate

The reason backups exist. Highest business value of all E2E flows.

**Precondition:** at least one successful backup with a recovery point.

**Steps:**

1. Navigate to `/clusters/recovery-points`, locate the recovery point of the test backup
2. Start a restore from it (restore wizard)
3. Select the target cluster/namespace, complete the wizard
4. Verify the restore job appears under `/clusters/restores` and in the Activity feed
5. Wait for the job — verify status "Successful"

**Expected:** Restore job completes successfully; restored resources reported.

## TC-RST-002 — Restores page renders 🟢 Low — ⬜ To automate

**Steps:**

1. Navigate to `/clusters/restores`
2. Verify heading and table (or empty state) render

**Expected:** Page loads without errors.

## TC-RP-001 — Recovery points page renders and filters 🟢 Low — ⬜ To automate

**Steps:**

1. Navigate to `/clusters/recovery-points`
2. Verify heading and table/empty state
3. Apply available filters (cluster, date) if present

**Expected:** Page loads; filters do not error on an empty org.
