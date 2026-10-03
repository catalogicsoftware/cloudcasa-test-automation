# Test Plan: Reports, Databases & DR (smoke)

- **App section:** `/reports`, `/databases`, `/dr`
- **Seed:** `seed.spec.ts` (fixture: `fixtures/auth.ts` → `loggedInPage`)
- **Docs:** CloudCasa → Reporting, Database backups, Disaster Recovery

Observed UI — Reports: report types (Success rate by cluster / by job definition, Last successful run by
cluster / by job definition, Current PVC details), period pickers, granularity combobox (Daily / Weekly /
Monthly / Yearly), tags filter, "Generate" button. Databases: Overview / Backups / Restores / Recovery
points sub-nav, "Add cloud account" link when empty. DR: DR clusters / Storage systems / Plans / Recovery
jobs sub-nav (paid feature on free plan).

---

## TC-REP-001 — Generate "Success rate by cluster" report 🟡 High — ⬜ To automate

**Steps:**

1. Log in, navigate to `/reports`
2. Verify default report "Success rate by cluster" with period buttons and granularity combobox (Daily, Weekly, Monthly, Yearly)
3. Change granularity to Weekly, click "Generate"
4. Verify the report table re-renders with the selected period columns (or a clean empty state)

**Expected:** Report generates without errors for every granularity.

## TC-REP-002 — All report types open 🟢 Low — ⬜ To automate

**Steps:**

1. Click through each report link: Success rate by job definition, Last successful run by cluster, Last successful run by job definition, Current PVC details
2. Verify each page renders its heading and Generate controls

**Expected:** No report type crashes on an empty organization.

## TC-DB-001 — Databases section smoke 🟢 Low — ⬜ To automate

**Steps:**

1. Navigate to `/databases`
2. Verify sub-nav: Overview, Backups, Restores, Recovery points
3. Verify empty state offers "Add cloud account" linking to cloud accounts configuration
4. Open each sub-tab — verify tables render

**Expected:** Section renders; empty org guides the user to add a cloud account.

## TC-DR-001 — DR section smoke 🟢 Low — ⬜ To automate

**Steps:**

1. Navigate to `/dr`
2. Verify sub-nav: Storage systems, Plans, Recovery jobs; DR clusters table renders
3. On the free plan verify DR features are gated (consistent with disabled "Enable CloudCasa DR" in Add Cluster)

**Expected:** Section renders; plan gating is consistent.
