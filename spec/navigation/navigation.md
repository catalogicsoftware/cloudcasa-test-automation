# Test Plan: Global Navigation & User Menu

- **App section:** top navigation bar, user menu (available on every logged-in page)
- **Seed:** `seed.spec.ts` (fixture: `fixtures/auth.ts` → `loggedInPage`)
- **Existing page objects:** `page-object-model/components/top-nav.components.ts`, `user-menu.components.ts`, `user-help-modal.components.ts`

Observed UI: main nav links Dashboard / Clusters / Databases / DR / Reports / Configuration; Support and
Help buttons; organization button ("<name> Organization"); user menu with Switch organization, Privacy
policy, Terms of service, API guide, Open source notices, User settings, Logout, Dark mode toggle; "free"
plan badge linking to `/configuration/pricing-plans`.

---

## TC-NAV-001 — Main navigation links open the correct sections 🔴 CRITICAL — ✅ Automated

**Test:** `tests/navigation/main-navigation-opens-each-section.spec.ts`

Smoke test for the whole app shell.

**Steps:**

1. Log in with valid credentials
2. Click each main nav link and verify URL and page heading:
   - Clusters → `/clusters`, heading "Clusters"
   - Databases → `/databases`, heading "Databases"
   - DR → `/dr`, heading "DR clusters"
   - Reports → `/reports`, heading "Reports: Success rate by cluster"
   - Configuration → `/configuration`, heading "Policies" (default sub-page)
   - Dashboard → `/dashboard`

**Expected:** Every section loads with its heading; no console errors / blank pages.

## TC-NAV-002 — Logout terminates the session 🔴 CRITICAL — ✅ Automated

**Test:** `tests/navigation/logout-terminates-the-session.spec.ts`

**Steps:**

1. Log in with valid credentials
2. Open the user menu, click "Logout"
3. Verify redirect to the Sign In page
4. Navigate directly to `/dashboard`

**Expected:** After logout the user cannot access `/dashboard`; the login form is shown instead.

## TC-NAV-003 — Unauthenticated access to protected routes redirects to login 🔴 CRITICAL — ✅ Automated

**Test:** `tests/navigation/protected-routes-need-a-session.spec.ts`

**Steps:**

1. Without a session (fresh context), open `/dashboard`, `/clusters`, `/configuration/users` directly
2. Verify each request lands on the Sign In page (auth redirect)

**Expected:** No protected content is rendered without authentication.

## TC-NAV-004 — User menu shows profile info and organization 🟡 High — ✅ Automated

**Test:** `tests/navigation/user-menu-shows-the-account-and-the-documents.spec.ts`

**Steps:**

1. Log in, open the user menu
2. Verify the user's display name is shown
3. Verify menu items: Switch organization, Privacy policy, Terms of service, API guide, Open source notices, User settings, Logout
4. Verify the organization name button in the top bar matches the registered organization

**Expected:** All items present; organization matches the account.

## TC-NAV-005 — Dark mode toggle switches the theme ⚪ Medium — ✅ Automated

**Test:** `tests/navigation/dark-mode-stays-after-a-reload.spec.ts`

**Steps:**

1. Log in, open the user menu
2. Toggle "Dark mode"
3. Verify the page background/theme attribute changes
4. Reload the page

**Expected:** Theme switches immediately and persists after reload.

## TC-NAV-006 — Legal links open published documents 🟡 High — ✅ Automated

**Test:** `tests/navigation/user-menu-shows-the-account-and-the-documents.spec.ts`

**Steps:**

1. Log in, open the user menu
2. Click "Privacy policy" — verify a new tab opens with the published policy URL
3. Click "Terms of service" — verify the published ToS opens
4. Click "API guide" — verify API documentation opens

**Expected:** Each link opens the correct external document (HTTP 200, expected title).

## TC-NAV-007 — Service plan badge leads to pricing plans 🟢 Low — ✅ Automated

**Test:** `tests/navigation/plan-badge-opens-the-pricing-plans.spec.ts`

**Steps:**

1. Log in; verify the "free" plan badge is visible in the top bar
2. Click the badge / "See available plans"
3. Verify URL `/configuration/pricing-plans` with plan cards rendered

**Expected:** Pricing plans page opens showing the current plan.

## TC-NAV-008 — Switch organization dialog ⚪ Medium — ✅ Automated

**Test:** `tests/navigation/switch-organization-dialog.spec.ts`

**Steps:**

1. Log in, open the user menu, click "Switch organization"
2. Verify the dialog lists organizations available to the user
3. Cancel the dialog

**Expected:** Dialog opens with the current organization marked; cancel returns to the app unchanged.
