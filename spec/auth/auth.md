# Test Plan: Authentication & Sign-Up (coverage map + gaps)

- **App section:** Sign In (Auth0-hosted widget), Forgot password, Sign-Up
- **Seed:** `seed.spec.ts` (fixture: `fixtures/base.ts`)

## Already automated ✅

These predate the `TC-*` numbering, so they are tracked as a flat list rather than as plan cases.

| Case                                          | Test file                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| Login with valid credentials                  | `tests/auth/login-with-valid-credentials.spec.ts`                          |
| Login with wrong password                     | `tests/auth/login-with-wrong-password.spec.ts`                             |
| Login with non-existent e-mail                | `tests/auth/login-with-non-existent-email.spec.ts`                         |
| Sign In disabled: empty form                  | `tests/auth/sign-in-button-disabled-empty-form.spec.ts`                    |
| Sign In disabled: e-mail only                 | `tests/auth/sign-in-button-disabled-email-only.spec.ts`                    |
| Forgot password form appears                  | `tests/auth/forgot-password-form-appears.spec.ts`                          |
| Back from forgot password to login            | `tests/auth/go-back-to-login-form.spec.ts`                                 |
| Password reset e-mail sent                    | `tests/auth/password-reset-email-sent.spec.ts`                             |
| Full password reset flow                      | `tests/auth/password-reset-flow-completes.spec.ts`                         |
| Organization shown after login                | `tests/auth/verification-orgranization-afer-login.spec.ts`                 |
| New user sign-up                              | `tests/sign-up/new-user.spec.ts`                                           |
| MSA / Privacy policy match published versions | `tests/sign-up/master-service-agreement-matches-published-version.spec.ts` |

## Remaining gaps to automate

### TC-AUTH-001 — Logout ends the session 🔴 CRITICAL — ⬜ To automate

Cross-reference only — the case lives as TC-NAV-002 in `specs/navigation/navigation.md` (it exercises the
user menu). Automate it there.

### TC-AUTH-002 — Protected routes redirect unauthenticated users 🔴 CRITICAL — ⬜ To automate

Cross-reference only — the case lives as TC-NAV-003 in `specs/navigation/navigation.md`.

### TC-AUTH-007 — Post-login landing is stable (no redirect loop) 🔴 CRITICAL — ✅ Automated

**Test:** `tests/auth/post-login-landing-is-stable.spec.ts`

**Customer evidence (Jira):** CC-590 — auth backend logs "login successful" but the UI shows
"Unauthorized" and redirects back to login in a loop.
**Steps:**

1. Log in with valid credentials
2. Verify a single redirect chain ends on `/dashboard` (no bounce back to the login page)
3. Verify no "Unauthorized" toast/state appears; dashboard API calls return authorized responses
4. Reload `/dashboard` — still authenticated, no loop
   **Expected:** Successful auth always lands and stays on the dashboard.

Related identity/org-scoping guards: TC-USR-005, TC-USR-006 in
`specs/configuration/user-management.md` (CC-474, CC-651/652/655/724).

### TC-AUTH-003 — Session persists across reload 🟡 High — ✅ Automated

**Test:** `tests/auth/post-login-landing-is-stable.spec.ts`

**Steps:**

1. Log in with valid credentials, land on `/dashboard`
2. Reload the page; open `/clusters` in the same context
   **Expected:** No re-login prompt; session cookie/token keeps the user signed in.

### TC-AUTH-004 — Password reset link is single-use / expires 🟡 High — ✅ Automated

**Test:** `tests/auth/password-reset-link-works-one-time.spec.ts`

**Steps:**

1. Complete a password reset via the Mailinator flow
2. Open the same reset link again
   **Expected:** Second use is rejected with a clear message.

### TC-AUTH-005 — Login with old password after reset fails 🟡 High — ✅ Automated

**Test:** `tests/auth/old-password-stops-after-a-reset.spec.ts`

**Steps:**

1. After a completed reset (existing flow), attempt login with the previous password
2. Expect "Wrong email or password."
3. Log in with the new password — success. Reset the password back for idempotency.
   **Expected:** Old credential invalidated immediately.

### TC-AUTH-006 — Sign-up validation (invalid e-mail, weak password, required consents) ⚪ Medium — 🟡 Blocked (live reCAPTCHA)

**Test:** `tests/sign-up/sign-up-refuses-bad-data.spec.ts` (marked `test.fixme()` — see the test's step 1/2 comment)

**Steps:**

1. Open the sign-up form (`SIGNUP_URL`)
2. Try invalid e-mail format, weak password, missing required checkboxes (MSA/policy)
   **Expected:** Each violation blocks submission with a field-level message.

**Blocker:** the sign-up page renders a live Google reCAPTCHA, not a disabled test stub. The
sign-up button stays disabled — even once every field and the consent checkbox hold valid
values — until the challenge is solved, which headless automation cannot do. The test detects
the widget at runtime and self-fixmes before the steps that need a real submit.
