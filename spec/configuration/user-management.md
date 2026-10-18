# Test Plan: Configuration — User Management & API Keys

- **App section:** `/configuration/users`, `/configuration/user-groups`, `/configuration/roles`, `/configuration/api-keys`
- **Seed:** `seed.spec.ts` (fixture: `fixtures/auth.ts` → `loggedInPage`)
- **Docs:** CloudCasa → User and access management (users, groups, roles, API keys)

Observed UI: Organization page with Users / Invitations tabs, "Invite user" button, users table (Name,
Email, Roles, Actions) — current admin listed with role ADMIN. API keys page: "New API key" button with a
plan quota ("API keys 0 of 1 created").

Mailinator integration already exists in the repo (`utils/mailinator.ts`) — invitation e-mails can be verified
end-to-end the same way as password reset.

---

## TC-USR-001 — Users page shows organization members and roles 🟡 High — ⬜ To automate

**Steps:**

1. Log in as admin, navigate to `/configuration/users`
2. Verify Users / Invitations tabs are present
3. Verify the current user's row: name, e-mail (`CC_EMAIL`), role ADMIN
4. Verify "Invite user" button is visible

**Expected:** Organization membership is rendered correctly.

## TC-USR-002 — Invite user: e-mail delivered and listed in Invitations 🔴 CRITICAL — ✅ Automated

**Test:** `tests/organization/invite-to-organization.spec.ts`

Access management is security-sensitive; invitations are the only way to add members.

**Steps:**

1. On `/configuration/users` click "Invite user"
2. Fill a Mailinator address (`data/mailinator-inboxes.ts`), select a role
3. Send the invitation
4. Verify the invitation appears on the "Invitations" tab with the correct e-mail and role
5. Read the Mailinator inbox — verify the invitation e-mail is received and contains an accept link
6. Cleanup: revoke the invitation

**Expected:** Invitation created, listed, and delivered by e-mail.

## TC-USR-003 — Invite user validation ⚪ Medium — ⬜ To automate

**Steps:**

1. Open the Invite user dialog
2. Try to submit with empty/invalid e-mail — verify validation blocks submission
3. Cancel

**Expected:** Invalid input cannot be submitted.

## TC-USR-004 — Revoke a pending invitation ⚪ Medium — ⬜ To automate

**Precondition:** pending invitation exists (from TC-USR-002 setup).

**Steps:**

1. On the Invitations tab open the invitation's actions
2. Revoke/delete it with confirmation
3. Verify it disappears from the list

**Expected:** Revoked invitation is removed; its accept link stops working.

## TC-USR-005 — Invited user sees the organization and its resources 🔴 CRITICAL — 🟨 Partial

**Test:** `tests/organization/invitation-link-prefills-signup.spec.ts` — covers steps 1–2 (invitation
e-mail names the org, its link prefills and locks the sign-up form). Steps 3–7 (accept, log in as the
invitee, verify org scope and resources) are blocked by a live reCAPTCHA on the sign-up form.

**Customer evidence (Jira):** CC-651/652/655/724 — users added to the portal but the org is not visible
("unable to see our project resources"). Org/tenant scoping after invite is a recurring failure.

**Steps:**

1. As admin, invite a Mailinator user (TC-USR-002 flow) with a member role
2. Fetch the accept link via the Mailinator API, accept the invitation in a fresh browser context (complete sign-up if required)
3. Log in as the invited user
4. Verify the top-bar organization button shows the inviting organization
5. Verify org resources are visible: clusters list, policies list render without "no access" errors
6. Verify the user appears on `/configuration/users` with the assigned role
7. Cleanup: remove the invited user from the organization

**Expected:** Freshly invited user lands in the correct organization and sees its resources immediately.

## TC-USR-006 — Session identity matches the logged-in user 🔴 CRITICAL — ⬜ To automate

**Customer evidence (Jira):** CC-474 — "my username is logging me in as someone else" (session/identity
mixup, high severity). Guard test against identity leakage between sessions.

**Steps:**

1. In browser context A log in as user 1; in a parallel isolated context B log in as user 2 (invited test user)
2. In each context open the user menu and verify the displayed name/e-mail matches that context's credentials
3. Verify the organization scope in each context matches the respective user
4. Reload both contexts — identities must not swap or leak

**Expected:** Each session consistently reflects its own user; no cross-session identity mixup.

## TC-ROLE-001 — Roles page lists built-in roles 🟢 Low — ⬜ To automate

**Steps:**

1. Navigate to `/configuration/roles`
2. Verify built-in roles (e.g. ADMIN) are listed with descriptions/permissions

**Expected:** Roles render; built-ins are not deletable.

## TC-KEY-001 — Create and delete an API key 🟡 High — ⬜ To automate

**Steps:**

1. Navigate to `/configuration/api-keys` — verify quota heading ("API keys N of M created")
2. Click "New API key", fill name `aqa-key-<timestamp>`, select role, save
3. Verify the key value/secret is displayed once and the key appears in the table (Name, Description, API key, Roles, Created)
4. Delete the key with confirmation
5. Verify the table is empty and the quota counter decremented

**Expected:** Key lifecycle works; secret shown at creation time.

## TC-KEY-002 — API key quota enforced on free plan ⚪ Medium — ⬜ To automate

**Precondition:** free plan org with quota 1.

**Steps:**

1. Create one API key (quota reached: "1 of 1 created")
2. Verify "New API key" is disabled or creation is blocked with a plan-limit message
3. Cleanup: delete the key

**Expected:** Quota is enforced in the UI.
