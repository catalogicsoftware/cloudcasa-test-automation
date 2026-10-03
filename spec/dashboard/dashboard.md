# Test Plan: Dashboard

- **App section:** `/dashboard` (default page after login)
- **Seed:** `seed.spec.ts` (fixture: `fixtures/auth.ts` → `loggedInPage`)
- **Source:** live app exploration (ui.staging.cloudcasa.io) + CloudCasa docs (Activity monitoring, Alerts)

Observed UI structure: jobs status filter bar (Running / Successful / Partial / Skipped / Failed) with a
time-range selector ("last 24h"), Clusters summary card (Configured / Healthy / Protected), Cloud providers
card (Google / Azure / Amazon links), Databases summary card, Activity / Cluster backups / Database backups
tabs with jobs table, Shortcuts panel, Alerts panel. First login shows a "Need some help?" modal.

---

## TC-DASH-001 — Help modal appears on first login and can be dismissed 🔴 CRITICAL — ✅ Automated

**Test:** `tests/dashboard/help-modal-opens-and-closes.spec.ts`

Blocks every other logged-in test: the modal overlays the whole dashboard.

**Steps:**

1. Log in with valid credentials as a user who has not disabled the popup
2. Verify "Need some help?" modal is visible with options: "Book a demo session with a CloudCasa expert", "Open documentation", "Please do not show this popup again"
3. Verify "Confirm" button is disabled while no option is selected
4. Close the modal via the Close (✕) button

**Expected:** Modal closes; dashboard content is interactive.

## TC-DASH-002 — Help modal "do not show again" persists ⚪ Medium — ✅ Automated

**Test:** `tests/dashboard/help-modal-stays-closed.spec.ts`

**Steps:**

1. Log in, in the help modal select "Please do not show this popup again"
2. Verify "Confirm" becomes enabled; click Confirm
3. Log out and log in again

**Expected:** Help modal is not shown after re-login.

## TC-DASH-003 — Dashboard widgets render for a logged-in user 🔴 CRITICAL — ✅ Automated

**Test:** `tests/dashboard/dashboard-shows-the-organization-status.spec.ts`

Smoke test that the landing page loads without errors.

**Steps:**

1. Log in with valid credentials (dismiss help modal)
2. Verify URL is `/dashboard`
3. Verify job status counters are visible: Running, Successful, Partial, Skipped, Failed
4. Verify Clusters card with Configured / Healthy / Protected headings and a link to `/clusters`
5. Verify Cloud providers card with Google, Azure, Amazon links
6. Verify Databases card (Accounts, Discovered DBs, Protected DBs, Size of protected DBs)
7. Verify Shortcuts panel and Alerts panel are visible

**Expected:** All widgets render; no empty-error states.

## TC-DASH-004 — Jobs table tab switching (Activity / Cluster backups / Database backups) 🟡 High — ✅ Automated

**Test:** `tests/dashboard/jobs-table-follows-the-tab-and-the-range.spec.ts`

**Steps:**

1. Log in, open dashboard
2. Click "Cluster backups" tab — verify URL query `activeTab=backups` and the table header row renders
3. Click "Database backups" tab — verify corresponding table renders
4. Click "Activity" tab — verify jobs table with columns: Job name, Type, Message, Started, Duration, Status

**Expected:** Tabs switch without page reload; table columns match the active tab.

## TC-DASH-005 — Jobs filtering by name and status ⚪ Medium — ⬜ To automate

**Steps:**

1. On the Activity tab, type a job name in the "Job name" filter
2. Verify the table shows only matching rows (or empty state)
3. Open "Status: All" dropdown and select a single status
4. Verify the applied filter counter ("Filter 1") appears and can be cleared via "×"

**Expected:** Filters combine; clearing filters restores the full list.

## TC-DASH-006 — Shortcuts navigate to the correct pages 🟡 High — 🟡 Blocked (Add Cluster dialog defect)

**Test:** `tests/dashboard/shortcuts-open-their-targets.spec.ts` (Add cluster step marked `test.fixme()` — see the test's last step comment)

**Steps:**

1. On the dashboard verify Shortcuts panel contains: "Clusters Overview", "Add cluster", "Cloud accounts", "Define cluster backup"
2. Click "Clusters Overview" → verify URL `/clusters`
3. Return to dashboard, click "Add cluster" → verify URL `/clusters?new=true` and the Add Cluster dialog is open
4. Return, click "Define cluster backup" → verify URL `/clusters/backups?new=true` and the wizard is open

**Expected:** Each shortcut deep-links to its target page/dialog.

**Blocker:** the "Add cluster" shortcut (and the in-page "Add cluster" button on `/clusters`,
independent of the deep link) never opens the Add Cluster dialog on staging — the URL settles on
`/clusters/overview` and no dialog appears. The other three shortcuts (Clusters Overview, Define
cluster backup, Cloud accounts) are verified and pass.

## TC-DASH-007 — Time range selector changes jobs scope ⚪ Medium — ✅ Automated

**Test:** `tests/dashboard/jobs-table-follows-the-tab-and-the-range.spec.ts`

**Steps:**

1. On the dashboard open the "last 24h" selector
2. Choose another range option
3. Verify the button label updates and the jobs table reloads

**Expected:** Selected range is applied and reflected in the UI.
