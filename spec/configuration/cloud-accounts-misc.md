# Test Plan: Configuration — Cloud Accounts, Audit Logs, Settings, Storage

- **App section:** `/configuration/cloud-accounts`, `/configuration/audit-logs`, `/configuration/preferences`, `/configuration/mystorage`, `/configuration/hooks`
- **Seed:** `seed.spec.ts` (fixture: `fixtures/auth.ts` → `loggedInPage`)
- **Docs:** CloudCasa → Cloud account integration (AWS/Azure/GCP), Audit logging, Storage, App hooks

Observed UI: Cloud accounts table (Name, Provider, Last inventory time, CloudCasa tags, State), Provider
filter, "Add cloud account" button. Dashboard links pre-filter by provider
(`?provider_type=gcp|azure|aws`).

> Full cloud-account linking requires real AWS/Azure/GCP credentials — mark execution steps
> **[needs cloud credentials]**; dialog/validation steps are automatable without them.

---

## TC-CA-001 — Add cloud account dialog: provider selection and validation 🟡 High — ✅ Automated

**Test:** `tests/cloud-accounts/cloud-account-dialog-per-provider.spec.ts`

**Steps:**

1. Log in, navigate to `/configuration/cloud-accounts`
2. Click "Add cloud account"
3. Verify provider choices (AWS / Azure / GCP) are offered
4. Select each provider and verify provider-specific required fields render
5. Verify submission is blocked while required fields are empty
6. Cancel

**Expected:** Dialog validates per provider; cancel creates nothing.

## TC-CA-002 — Provider deep links pre-filter the list ⚪ Medium — ✅ Automated

**Test:** `tests/cloud-accounts/cloud-account-dialog-per-provider.spec.ts`

**Steps:**

1. Open `/configuration/cloud-accounts?provider_type=aws` (also `azure`, `gcp` — the dashboard card links)
2. Verify the Provider filter is applied accordingly

**Expected:** Query param drives the filter (dashboard integration).

## TC-CA-003 — Link a real cloud account 🟡 High [needs cloud credentials] — ⬜ To automate

**Steps:**

1. Add a cloud account with valid test credentials for one provider
2. Verify state transitions to Active and "Last inventory time" populates after inventory
3. Verify discovered databases appear under `/databases`
4. Cleanup: remove the account

**Expected:** Account links, inventories, and surfaces resources.

## TC-AUD-001 — Audit log records user actions 🟡 High — ⬜ To automate

Compliance feature — silently breaking it is costly.

**Steps:**

1. Log in, perform a traceable action (e.g. create + delete a policy)
2. Navigate to `/configuration/audit-logs`
3. Verify entries exist for the performed actions with correct user, timestamp and action type
4. Verify filtering by date/user/action works

**Expected:** Actions are audited and searchable.

## TC-SET-001 — Organization settings page renders and saves ⚪ Medium — ⬜ To automate

**Steps:**

1. Navigate to `/configuration/preferences`
2. Verify the settings form renders with current values
3. Change a harmless setting, save, reload — verify persistence; revert

**Expected:** Settings persist across reloads.

> **Storage** moved to a dedicated plan — `specs/configuration/storage.md` — and upgraded to the top
> customer-driven priority (~16 support tickets on add/validate failures).

## TC-HOOK-001 — App hooks page renders and validates creation dialog 🟢 Low — 🟨 Partial

**Test:** `tests/configuration/hooks-refuse-an-empty-hook.spec.ts` — covers the page load, the
table/empty-state check, opening the add-hook drawer, and Save staying disabled while the form
is empty. Not covered (blocked by the app defect below, `test.fixme()` at the test's step 6):
Save enabling once every required field is filled, clearing a field re-disabling Save, and the
cancel/reload/no-new-hook check.

**Steps:**

1. Navigate to `/configuration/hooks`
2. Open the add-hook dialog, verify required fields block empty submission, cancel

**Expected:** Page and dialog behave; nothing created on cancel.

**Blocker:** the "Add application hook" drawer's Save button stays disabled after Name, Type
and Command — the three fields the form itself marks as required — are all filled. It only
re-evaluates and enables once an unrelated field (e.g. Container, which has no required marker)
is also edited.
