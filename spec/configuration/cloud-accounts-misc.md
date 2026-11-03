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
and Command — the three fields the form itself marks as required — are all filled. Confirmed via
live diagnostics this is not a test-side fill/timing issue: Name's async uniqueness check
round-trips and resolves valid, Type and Command both end up valid and dirty, and no further
interaction brings Save back — touching the non-required Container field, adding a second
repeat-group row, or any combination of the above leaves it disabled. Save never re-evaluates.

## TC-SET-002 — Turning off cloud accounts hides Databases and the Cloud providers widget ⚪ Medium — 🟨 Partial

**Test:** `tests/configuration/cloud-accounts-toggle-hides-databases.spec.ts` — steps 1–3, 5 and 6 for the
"Cloud providers" widget and "Databases" (hidden, still hidden after a reload, back after the toggle is on again), plus
the "Cloud accounts" menu item coming back in step 6.

**Test:** `tests/configuration/cloud-accounts-toggle-hides-configuration-menu-item.spec.ts` — step 4 and its reload,
marked `test.fixme()`: open defect — with the toggle off the Configuration menu still lists "Cloud accounts", also
after a reload (recon 2026-11-02).

Both hold the `organization-name` and `cloud-accounts` locks (`fixtures/base.ts`), since the save rewrites the whole
organization; step 7 is the `cloudAccountsEnabled` fixture teardown.

**Customer evidence (Jira):** CC-629, CC-648, CC-230 (customers want to hide the dashboard "Cloud
providers" widget), CC-340 and CC-256 (regressions: the Databases menu came back although it was turned off).

Observed (recon 2026-10-28): `/configuration/preferences` → section "Features" → toggle "Enable cloud
accounts" (on). Saving it off writes `uiprefs.disabled_cloudaccounts = "true"` on the org (inverted flag);
the frontend then sets `features.cloudaccounts = false` and `features.databases = false`.

**Steps:**
1. Log in; verify the dashboard shows the "Cloud providers" widget and the top nav shows "Databases"
2. Open `/configuration/preferences`, switch "Enable cloud accounts" off, click "Save"
3. Open the dashboard — verify the "Cloud providers" widget and the "Databases" nav item are gone
4. Verify "Cloud accounts" is gone from the Configuration menu
5. Reload — verify they stay hidden
6. Switch "Enable cloud accounts" on again, save — verify widget and menu items come back
7. Cleanup: restore the flag via API if a step failed

**Expected:** The toggle hides and restores the cloud-account features everywhere and survives a reload.

## TC-SET-003 — A renamed organization shows its new name everywhere ⚪ Medium — ✅ Automated

**Test:** `tests/configuration/renamed-organization-shows-new-name.spec.ts`

**Customer evidence (Jira):** CC-232 — after a rename the org switcher still showed the old name
(`name` vs `display_name`).

Observed (recon 2026-10-28): two rename places — `/configuration/preferences` field "Organization name *",
and `/configuration/users/organization-users` → "Name: …" edit icon → dialog "Change organization name"
("Organization name *", "Cancel" / "Change"; the input starts empty, the current name is only a placeholder).
The API keeps `name` (internal) and `display_name` (shown).

**Steps:**
1. Log in, open `/configuration/users/organization-users`, click the edit icon next to "Name:"
2. Enter a generated name, click "Change"
3. Verify the "Name:" line, the top-bar organization button, the "Select organization" dialog and the
   "Organization name" field on `/configuration/preferences` all show the new name
4. Reload — verify the new name stays everywhere
5. Cleanup: restore the original display name via API

**Expected:** One rename changes every place that shows the organization name.

## TC-SET-004 — The default storage can be set and cleared ⚪ Medium — ✅ Automated

**Test:** `tests/configuration/default-storage-set-and-cleared.spec.ts` — the dropdown lists a storage
that is still `VALIDATING`, so no live cluster is needed. The clear control is the "Remove selected" menu
item, not a "×" on the field (recon 2026-10-29).

**Customer evidence (Jira):** CC-228 (422 error when setting the default storage), CC-133 (the default
storage could not be cleared, so the organization could not be deleted).

Observed (recon 2026-10-28): `/configuration/preferences` → "Default storage" dropdown with a clear "×";
with no storage it shows "No options available" and the warning "Please make sure that storage is
configured at cluster, job, or organization level."

**Steps:**
1. Seed an object storage via API (`testResourceName('storage')`)
2. Open `/configuration/preferences`, select the storage in "Default storage", click "Save"
3. Verify a success toast, no error toast (no 422); reload — the storage stays selected
4. Clear the dropdown with "×", click "Save"; reload — the field is empty
5. Cleanup: clear the default storage and delete the storage via API

**Expected:** The default storage is saved and can be cleared again without errors.
