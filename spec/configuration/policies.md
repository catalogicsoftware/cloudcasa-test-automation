# Test Plan: Configuration — Policies

- **App section:** `/configuration/policies` (default Configuration sub-page)
- **Seed:** `seed.spec.ts` (fixture: `fixtures/auth.ts` → `loggedInPage`)
- **Docs:** CloudCasa → Policy creation and management (schedules, retention)

Observed UI: Policies table (Name, Schedules, Timezone), Name filter, "Add policy" button. Add policy
dialog: Policy name (required), Timezone combobox (defaults to browser timezone), schedule configuration.

Policies are pure metadata — fully automatable without a live cluster. Good high-value target.

---

## TC-POL-001 — Create a policy with a schedule 🔴 CRITICAL — ✅ Automated

**Test:** `tests/policies/create-policy-with-schedule.spec.ts` — one generated test per frequency
(daily, weekly, monthly, custom cron), each with a random time, interval, weekday/day-of-month,
retention and timezone from `data/policies.ts`.

Policies drive all scheduled protection; broken policy CRUD silently stops backups.

**Steps:**

1. Log in, navigate to `/configuration/policies`
2. Click "Add policy"
3. Verify dialog opens with "Policy name" (required) and "Timezone" combobox pre-filled with a default
4. Fill name `aqa-policy-<timestamp>`, add a schedule (e.g. daily), keep default timezone
5. Save
6. Verify the policy appears in the table with correct Name, Schedules and Timezone values
7. Cleanup: delete the policy

**Expected:** Policy created and listed with the exact configured values.

## TC-POL-002 — Policy name validation ⚪ Medium — ✅ Automated

**Test:** `tests/policies/policies-filter-finds-one-policy.spec.ts` — the empty-name check runs
as a step of the filter flow (P-02).

**Steps:**

1. Open "Add policy"
2. Leave the name empty — verify Save/Confirm is disabled or shows a validation error
3. Cancel the dialog

**Expected:** Cannot create a nameless policy; cancel leaves the list unchanged.

## TC-POL-003 — Edit an existing policy 🟡 High — ✅ Automated

**Test:** `tests/policies/edit-a-policy-keeps-the-change.spec.ts` — a daily policy made through
the API, edited through the UI (timezone and schedule time), verified in the table, after a
reload, and again inside the reopened edit dialog.

**Precondition:** disposable policy exists (create via TC-POL-001 setup).

**Steps:**

1. Open the policy's edit action
2. Change the timezone and/or schedule
3. Save
4. Verify the table reflects the updated values; reopen edit and verify persisted fields

**Expected:** Changes persist after save and reload.

## TC-POL-004 — Delete a policy with confirmation 🟡 High — ✅ Automated

**Test:** `tests/policies/create-policy-with-schedule.spec.ts` — removal closes each generated
case, the way TC-STG-009 is covered by the storage happy path.

**Precondition:** disposable policy exists.

**Steps:**

1. Open the policy's delete action
2. Verify confirmation dialog appears
3. Confirm
4. Verify the policy disappears from the table

**Expected:** Policy removed only after confirmation.

## TC-POL-006 — Free plan refuses a sub-daily schedule 🟡 High — ✅ Automated

**Test:** `tests/policies/policy-rejects-sub-daily-cron.spec.ts`

Hourly is disabled in the dialog, but the Custom cron field enforces nothing, so the plan limit is
only reachable through the backend.

**Steps:**

1. Open "Add policy", verify Hourly is disabled
2. Add a `*/30 * * * *` cron schedule with a retention
3. Save

**Expected:** POST returns 422 "Schedules more frequent than daily are not allowed for free
accounts", the toast repeats it, the dialog stays open and no policy row appears.

## TC-POL-005 — Policies list filter by name 🟢 Low — ✅ Automated

**Test:** `tests/policies/policies-filter-finds-one-policy.spec.ts`

**Steps:**

1. With ≥1 policy present, filter by an existing name — matching rows only
2. Filter by garbage string — empty state
3. Clear the filter

**Expected:** Filter narrows and restores the list correctly.

---

## Known issues found while automating

- **The cron field validates nothing (staging, 2026-09-10).** `not a cron` and `99 99 * * *` are
  accepted as `ng-valid` and "Add to schedule" adds them; only the backend refuses, and nothing is
  reported on the field itself. The plan limit behaves the same way but at least names the cause,
  which is what TC-POL-006 covers — a malformed expression still gets no message.
- **A cron schedule is listed as "Hourly"** whatever the expression says, so `expectedFrequency()`
  maps Custom to Hourly rather than asserting the frequency the dialog was given.
- **Retention is capped at 30 days** by the field's own `max`, and exceeding it only disables
  "Add to schedule" with no message.

The earlier note here claimed Custom cron was a silent no-op. It is not: a valid expression builds a
schedule and creates the policy. The reading came from a sub-hourly expression sampled mid-validation.
