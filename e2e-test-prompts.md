# CloudCasa — E2E Automation Prompts

Each section below holds one prompt. One prompt automates one test.
Give one prompt to one agent. Claude Code and Codex accept the same text.

The text uses ASD-STE100 Simplified Technical English: one instruction for each sentence,
the imperative mood, approved words and short sentences.

**Source:** the plans in `specs/`. Each prompt names its plan case (`TC-*`).
Cases that are already automated are not in this file.
Some plan cases are small. A small case is not a test on its own, because this project
writes E2E tests only. Such a case is a step in a larger prompt. The **Covers** line
names every plan case of the prompt.

---

## How to use a prompt

1. Open the section of the test that you want.
2. Copy the full block between the two code fences.
3. Give the block to the agent.
4. Let the agent write the test file, run it and correct it.
5. Read the **Blocked by** line first. Do not start a blocked prompt.

---

## COMMON RULES

Every prompt refers to this list. Do not delete this section.

```text
COMMON RULES — obey all of them.
1.  Read CLAUDE.md in the repository root first. CLAUDE.md has priority over this list.
2.  Write one E2E test in one file. The file name is the scenario name.
3.  Do not write a UI-only test. Each check is a step on the way to a user result.
4.  Import `test` and `expect` from the deepest fixture that gives what you need.
5.  Use the path aliases @page-object-model, @page-factory, @fixtures, @data and @utils.
6.  Use the page objects in page-object-model/. Read the skill cloudcasa-page-objects
    before you add a page object, a locator or an action.
7.  Do not put an assertion in a page object.
8.  Write one comment before each step. The comment holds the step text. One line only.
9.  Make each resource name with testResourceName() from @utils/resource-names.
10. Remove each created resource after the test. Use the CloudCasa API for the removal.
11. Seed a precondition through the API when this makes the test shorter or more stable.
12. Assert through the UI. Do not assert only on an API answer.
13. Do not use waitForNetworkIdle. Do not use a deprecated Playwright function.
14. Use a regular expression locator for dynamic data.
15. Close the help modal after each login. Use dashboardPage.userHelpModal.closeModal().
16. Run `npx playwright test <file>` two times. The test must pass two times.
17. If the application has a defect, mark the test with test.fixme(). Write one comment.
    The comment gives the actual behavior and the expected behavior.
18. Update the status mark and the `**Test:**` line of the case in specs/.
```

---

## Index

| ID | Test | Covers | Priority | Blocked by |
| --- | --- | --- | --- | --- |
| A-01 | The session stays on the dashboard after the login | TC-AUTH-007, TC-AUTH-003 | CRITICAL | — |
| A-02 | The logout terminates the session | TC-NAV-002, TC-AUTH-001 | CRITICAL | — |
| A-03 | A protected route sends an unknown user to the login page | TC-NAV-003, TC-AUTH-002 | CRITICAL | — |
| A-04 | The old password does not work after a password reset | TC-AUTH-005 | High | — |
| A-05 | A password reset link works one time only | TC-AUTH-004 | High | — |
| A-06 | The sign-up form refuses bad data and then accepts good data | TC-AUTH-006 | Medium | reCAPTCHA |
| A-07 | Two sessions keep their own identity | TC-USR-006 | CRITICAL | — |
| N-01 | The main navigation opens each section | TC-NAV-001, TC-CL-001 | CRITICAL | — |
| N-02 | The user menu shows the identity and opens the legal documents | TC-NAV-004, TC-NAV-006 | High | — |
| N-03 | The dark mode stays on after a reload | TC-NAV-005 | Medium | — |
| N-04 | The plan badge opens the pricing plans | TC-NAV-007 | Low | — |
| N-05 | The organization dialog shows the organizations of the user | TC-NAV-008 | Medium | — |
| D-01 | The help modal appears and closes at the first login | TC-DASH-001 | CRITICAL | — |
| D-02 | The help modal stays closed after the user refuses it | TC-DASH-002 | Medium | — |
| D-03 | The dashboard shows the status of the organization | TC-DASH-003 | CRITICAL | — |
| D-04 | The jobs table changes with the tab and with the time range | TC-DASH-004, TC-DASH-007 | High | — |
| D-05 | The jobs filters find a job | TC-DASH-005 | Medium | job history |
| D-06 | Each shortcut opens its target | TC-DASH-006, TC-CL-004, TC-BAK-005 | High | — |
| C-01 | The user registers a cluster and removes it | TC-CL-002, TC-CL-003, TC-CL-005, TC-CL-007 | CRITICAL | — |
| C-02 | The install manifest holds a pull secret and a good image tag | TC-CL-008 | CRITICAL | — |
| C-03 | The clusters filters find one cluster | TC-CL-006 | Medium | — |
| B-01 | The backup wizard refuses a backup without a cluster | TC-BAK-001, TC-BAK-004 | CRITICAL | — |
| B-02 | The user defines a cluster backup | TC-BAK-002 | CRITICAL | live cluster |
| B-03 | A backup runs and makes a recovery point | TC-BAK-003, TC-RP-001 | CRITICAL | live cluster |
| B-04 | The user restores a recovery point | TC-RST-001, TC-RST-002 | CRITICAL | live cluster |
| P-01 | The user changes a policy and the change stays | TC-POL-003 | High | — |
| P-02 | The policies filter finds one policy of many | TC-POL-005, TC-POL-002 | Low | — |
| S-01 | The wizard refuses a bad endpoint URL and accepts a good one | TC-STG-002 | CRITICAL | — |
| S-02 | An isolated storage needs a proxy cluster | TC-STG-006 | High | — |
| S-03 | The provider switch does not keep old values | TC-STG-007 | High | — |
| S-04 | The TLS option stays on the saved storage | TC-STG-008 | Medium | — |
| S-05 | A storage with an unknown bucket gives a bucket error | TC-STG-004 | CRITICAL | — |
| S-06 | The user adds an NFS file storage | TC-STG-010 | High | NFS target |
| S-07 | The storage shows a positive reachability mark | TC-STG-005 | CRITICAL | live cluster |
| U-01 | The admin invites a user, sees the role and revokes the invitation | TC-USR-001, TC-USR-003, TC-USR-004, TC-ROLE-001 | High | — |
| U-02 | An invited user sees the organization and its resources | TC-USR-005 | CRITICAL | — |
| U-03 | The user makes an API key and deletes it | TC-KEY-001 | High | — |
| U-04 | The free plan stops the second API key | TC-KEY-002 | Medium | — |
| G-01 | The cloud account dialog asks for the fields of each provider | TC-CA-001, TC-CA-002 | High | — |
| G-02 | The user links a real cloud account | TC-CA-003 | High | cloud credentials |
| G-03 | The audit log records a policy change | TC-AUD-001 | High | — |
| G-04 | An organization setting stays after a reload | TC-SET-001 | Medium | — |
| G-05 | The hooks page refuses an empty hook | TC-HOOK-001 | Low | — |
| R-01 | Each report type gives a result for each granularity | TC-REP-001, TC-REP-002 | High | — |
| R-02 | The empty Databases section sends the user to the cloud accounts | TC-DB-001 | Low | — |
| R-03 | The free plan gates the DR section | TC-DR-001 | Low | — |

**Total: 46 prompts.** 40 prompts have no blocker.

---

# Group A — Authentication and session

## A-01 — The session stays on the dashboard after the login

**Covers:** TC-AUTH-007, TC-AUTH-003 · **Priority:** CRITICAL · **Blocked by:** — · **Jira:** CC-590

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-AUTH-007 and TC-AUTH-003 in specs/auth/auth.md
Test file: tests/auth/post-login-landing-is-stable.spec.ts
Fixture: @fixtures/base
Describe title: Authentication
Test title: The session stays on the dashboard after the login

Background: the support ticket CC-590 reports a login loop. The backend accepts the
credentials, but the user interface shows "Unauthorized" and goes back to the login page.

Steps:
1. Collect all API answers of the page. Use the response event of the page.
2. Open the login page.
3. Log in with CC_EMAIL and CC_PASSWORD.
4. Make sure that the last URL is the dashboard URL.
5. Make sure that the browser is not on the login page.
6. Make sure that no toast shows the text "Unauthorized".
7. Make sure that no collected answer of the API has the status 401 or 403.
8. Reload the dashboard page.
9. Make sure that the user is still on the dashboard.
10. Open the clusters page in the same context.
11. Make sure that the application does not ask for the credentials again.
12. Make sure that the clusters page shows its heading.

Expected result: one login gives one stable dashboard. No loop and no 401 answer.

Notes:
- Do not use the loggedInPage fixture. That fixture makes a second login attempt after a
  failure, and this test must see the first attempt.
- Record the URL history with the framenavigated event to count the redirects.
```

---

## A-02 — The logout terminates the session

**Covers:** TC-NAV-002, TC-AUTH-001 · **Priority:** CRITICAL · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-NAV-002 in specs/navigation/navigation.md
Test file: tests/navigation/logout-terminates-the-session.spec.ts
Fixture: @fixtures/auth
Describe title: Global Navigation & User Menu
Test title: The logout terminates the session

Steps:
1. Log in as the admin user with the loggedInPage fixture.
2. Close the help modal.
3. Open the user menu.
4. Click "Logout".
5. Make sure that the browser goes to the Sign In page.
6. Make sure that the Sign In form is visible.
7. Open the dashboard URL with a direct navigation.
8. Make sure that the application shows the Sign In form again.
9. Make sure that the page does not show the dashboard content.

Expected result: the logout removes the session. A protected page is not available after
the logout.

Notes:
- Use the component page-object-model/components/user-menu.components.ts.
- Add the Logout action to that component if the action is not there.
```

---

## A-03 — A protected route sends an unknown user to the login page

**Covers:** TC-NAV-003, TC-AUTH-002 · **Priority:** CRITICAL · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-NAV-003 in specs/navigation/navigation.md
Test file: tests/navigation/protected-routes-need-a-session.spec.ts
Fixture: @fixtures/base
Describe title: Global Navigation & User Menu
Test title: A protected route sends an unknown user to the login page

Steps:
1. Start the test in a clean context. Do not log in.
2. Open /dashboard with a direct navigation.
3. Make sure that the Sign In form is visible.
4. Make sure that the page does not show the dashboard content.
5. Do step 2 to step 4 again for /clusters.
6. Do step 2 to step 4 again for /configuration/users.
7. Log in with CC_EMAIL and CC_PASSWORD.
8. Make sure that the user gets the dashboard.
9. Open /configuration/users again.
10. Make sure that the users page shows the table of the members.

Expected result: no protected content is available without a session. The same route
opens correctly after a login.

Notes:
- Make the list of the three routes a constant array. Use a loop for the steps 2 to 6.
```

---

## A-04 — The old password does not work after a password reset

**Covers:** TC-AUTH-005 · **Priority:** High · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-AUTH-005 in specs/auth/auth.md
Test file: tests/auth/old-password-stops-after-a-reset.spec.ts
Fixture: @fixtures/auth
Describe title: Authentication
Test title: The old password does not work after a password reset

Precondition: the reset account of MailinatorInbox.RESET_PWD.
Request the mailboxAccess fixture. That fixture stops the worker on a bad token.

Steps:
1. Read the current password of the reset account from the environment.
2. Make a new password with the helper in @data/fake.
3. Do the full password reset flow. Use the same steps as
   tests/auth/password-reset-flow-completes.spec.ts.
4. Open the login page.
5. Log in with the old password.
6. Make sure that the form shows the message "Wrong email or password.".
7. Make sure that the browser stays on the login page.
8. Log in with the new password.
9. Make sure that the user gets the dashboard.

Cleanup:
10. Set the password back to the first value with one more reset flow.
11. Make sure that the login with the first password works again.

Expected result: a reset stops the old password immediately. The test leaves the account
in its first state.

Notes:
- Reuse the mail helpers in @utils/mailinator.ts. Do not add a new inbox.
- Keep the number of the Mailinator calls low. The daily budget is MAILINATOR_DAILY_BUDGET.
```

---

## A-05 — A password reset link works one time only

**Covers:** TC-AUTH-004 · **Priority:** High · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-AUTH-004 in specs/auth/auth.md
Test file: tests/auth/password-reset-link-works-one-time.spec.ts
Fixture: @fixtures/auth
Describe title: Authentication
Test title: A password reset link works one time only

Precondition: the reset account of MailinatorInbox.RESET_PWD.
Request the mailboxAccess fixture.

Steps:
1. Ask for a password reset for the account.
2. Read the reset link from the inbox with @utils/mailinator.ts.
3. Open the link and set a new password.
4. Make sure that the application reports the success.
5. Open the same link a second time in a clean context.
6. Make sure that the page refuses the link.
7. Make sure that the message names the cause. The message must say that the link is
   used or expired.
8. Make sure that the page does not show the form for a new password.
9. Log in with the new password.
10. Make sure that the user gets the dashboard.

Cleanup:
11. Set the password back to the first value.

Expected result: a used reset link gives a clear refusal. The account keeps the new
password.
```

---

## A-06 — The sign-up form refuses bad data and then accepts good data

**Covers:** TC-AUTH-006 · **Priority:** Medium · **Blocked by:** the live reCAPTCHA

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-AUTH-006 in specs/auth/auth.md
Test file: tests/sign-up/sign-up-refuses-bad-data.spec.ts
Fixture: @fixtures/base
Describe title: Sign-Up
Test title: The sign-up form refuses bad data and then accepts good data

Warning: a live reCAPTCHA can stop the last step. Do step 1 first.

Steps:
1. Open the sign-up page and find out if the reCAPTCHA is active.
2. If the reCAPTCHA stops the submit, mark the test with test.fixme(). Write one comment.
3. Make a user with fakeUser() from @data/fake.
4. Fill the e-mail field with a string without an at sign.
5. Make sure that the form shows a field message and the submit stays off.
6. Fill a good e-mail and a short password.
7. Make sure that the form shows the password rule and the submit stays off.
8. Fill a good password. Keep the agreement checkboxes empty.
9. Make sure that the submit stays off.
10. Select the agreement checkboxes.
11. Make sure that the submit is on.
12. Send the form.
13. Make sure that the application makes the account and shows the next page.

Expected result: each bad value blocks the submit with its own message. The correct form
makes the account.

Notes:
- Reuse page-object-model/pages/auth/sign-up.page.ts.
- The happy path is in tests/sign-up/new-user.spec.ts. Do not write it two times.
```

---

## A-07 — Two sessions keep their own identity

**Covers:** TC-USR-006 · **Priority:** CRITICAL · **Blocked by:** — · **Jira:** CC-474

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-USR-006 in specs/configuration/user-management.md
Test file: tests/organization/two-sessions-keep-their-identity.spec.ts
Fixture: @fixtures/auth
Describe title: Organization
Test title: Two sessions keep their own identity

Background: the support ticket CC-474 reports an identity mix. A user got the session of
another user.

Precondition: the admin account and the registered user of MailinatorInbox.INVITE_REGISTERED.

Steps:
1. Make two isolated browser contexts. Name them A and B.
2. Log in as the admin user in the context A.
3. Log in as the registered user in the context B.
4. Open the user menu in the context A.
5. Make sure that the menu shows the e-mail of the admin user.
6. Open the user menu in the context B.
7. Make sure that the menu shows the e-mail of the registered user.
8. Make sure that the organization button of each context shows the correct organization.
9. Reload both pages.
10. Do step 4 to step 8 again.
11. Open /configuration/users in the context A.
12. Make sure that the page shows the admin user with the role ADMIN.

Expected result: each context keeps its own user. No identity moves between the contexts.

Notes:
- Make the second context with browser.newContext(). Do not use the page fixture for both users.
- Use the fixture cleanRegisteredUserState if the test changes the organization members.
```

---

# Group N — Application shell and navigation

## N-01 — The main navigation opens each section

**Covers:** TC-NAV-001, TC-CL-001 · **Priority:** CRITICAL · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-NAV-001 in specs/navigation/navigation.md
Test file: tests/navigation/main-navigation-opens-each-section.spec.ts
Fixture: @fixtures/auth
Describe title: Global Navigation & User Menu
Test title: The main navigation opens each section

Steps:
1. Log in as the admin user.
2. Close the help modal.
3. Click the link "Clusters".
4. Make sure that the URL is /clusters and the heading is "Clusters".
5. Make sure that the clusters page shows its sub-navigation. The sub-navigation holds
   Overview, Backups, Restores, Migration, Replication and Recovery points.
6. Make sure that the clusters table shows the columns Name, Kubernetes version, Agent
   version, Nodes, State and Last updated.
7. Click the link "Databases". Make sure that the URL is /databases.
8. Click the link "DR". Make sure that the URL is /dr and the heading is "DR clusters".
9. Click the link "Reports". Make sure that the URL is /reports.
10. Click the link "Configuration". Make sure that the URL is /configuration.
11. Make sure that the Configuration page opens the sub-page "Policies" by default.
12. Click the link "Dashboard". Make sure that the URL is /dashboard.
13. Make sure that no page of the steps 3 to 12 stays empty.

Expected result: each section of the application shell opens with its own heading.

Notes:
- Put the pairs of the link and the expected URL in one constant array.
- Use page-object-model/components/top-nav.components.ts for the links.
- Collect the console errors. Report an error message that names a failed page.
```

---

## N-02 — The user menu shows the identity and opens the legal documents

**Covers:** TC-NAV-004, TC-NAV-006 · **Priority:** High · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-NAV-004 and TC-NAV-006 in specs/navigation/navigation.md
Test file: tests/navigation/user-menu-shows-the-account-and-the-documents.spec.ts
Fixture: @fixtures/auth
Describe title: Global Navigation & User Menu
Test title: The user menu shows the identity and opens the legal documents

Steps:
1. Log in as the admin user.
2. Close the help modal.
3. Open the user menu.
4. Make sure that the menu shows the name of the user.
5. Make sure that the menu holds these items: Switch organization, Privacy policy, Terms
   of service, API guide, Open source notices, User settings and Logout.
6. Make sure that the organization button of the top bar shows the organization of the account.
7. Click "Privacy policy". Catch the new page.
8. Make sure that the new page opens the published privacy policy URL.
9. Go back to the application and open the user menu again.
10. Do the steps 7 to 9 again for "Terms of service".
11. Do the steps 7 to 9 again for "API guide".
12. Make sure that each document answers with the status 200.

Expected result: the menu shows the correct account and each legal link opens its document.

Notes:
- Catch a new tab with the popup event of the browser context.
- Check the status with a request of the API context. Do not download the full document.
```

---

## N-03 — The dark mode stays on after a reload

**Covers:** TC-NAV-005 · **Priority:** Medium · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-NAV-005 in specs/navigation/navigation.md
Test file: tests/navigation/dark-mode-stays-after-a-reload.spec.ts
Fixture: @fixtures/auth
Describe title: Global Navigation & User Menu
Test title: The dark mode stays on after a reload

Steps:
1. Log in as the admin user.
2. Close the help modal.
3. Read the theme attribute of the page body.
4. Open the user menu.
5. Set the switch "Dark mode" to on.
6. Make sure that the theme attribute changes immediately.
7. Reload the dashboard.
8. Make sure that the theme attribute keeps the dark value.
9. Open the clusters page.
10. Make sure that the dark theme is also on that page.

Cleanup:
11. Set the switch "Dark mode" back to the first value.

Expected result: the theme changes immediately and stays after a reload and a navigation.
```

---

## N-04 — The plan badge opens the pricing plans

**Covers:** TC-NAV-007 · **Priority:** Low · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-NAV-007 in specs/navigation/navigation.md
Test file: tests/navigation/plan-badge-opens-the-pricing-plans.spec.ts
Fixture: @fixtures/auth
Describe title: Global Navigation & User Menu
Test title: The plan badge opens the pricing plans

Steps:
1. Log in as the admin user.
2. Close the help modal.
3. Make sure that the top bar shows the badge "free".
4. Click the badge.
5. Make sure that the URL is /configuration/pricing-plans.
6. Make sure that the page shows the plan cards.
7. Make sure that the page marks the free plan as the current plan.

Expected result: the badge takes the user to the plans and shows the current plan.
```

---

## N-05 — The organization dialog shows the organizations of the user

**Covers:** TC-NAV-008 · **Priority:** Medium · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-NAV-008 in specs/navigation/navigation.md
Test file: tests/navigation/switch-organization-dialog.spec.ts
Fixture: @fixtures/auth
Describe title: Global Navigation & User Menu
Test title: The organization dialog shows the organizations of the user

Steps:
1. Log in as the admin user.
2. Close the help modal.
3. Read the organization name from the top bar.
4. Open the user menu.
5. Click "Switch organization".
6. Make sure that the dialog is visible.
7. Make sure that the dialog holds the organization of the step 3.
8. Make sure that the dialog marks that organization as the current one.
9. Click "Cancel".
10. Make sure that the dialog is not visible.
11. Make sure that the top bar still shows the organization of the step 3.
12. Make sure that the dashboard content is available again.

Expected result: the dialog shows the organizations and the cancel changes nothing.
```

---

# Group D — Dashboard

## D-01 — The help modal appears and closes at the first login

**Covers:** TC-DASH-001 · **Priority:** CRITICAL · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-DASH-001 in specs/dashboard/dashboard.md
Test file: tests/dashboard/help-modal-opens-and-closes.spec.ts
Fixture: @fixtures/auth
Describe title: Dashboard
Test title: The help modal appears and closes at the first login

Background: the modal covers the full dashboard. Each other logged-in test waits for it.

Precondition: an account that did not refuse the modal.

Steps:
1. Log in as the admin user.
2. Make sure that the modal "Need some help?" is visible.
3. Make sure that the modal holds the option "Book a demo session with a CloudCasa expert".
4. Make sure that the modal holds the option "Open documentation".
5. Make sure that the modal holds the option "Please do not show this popup again".
6. Make sure that the button "Confirm" is off while no option is selected.
7. Click the close button of the modal.
8. Make sure that the modal is not visible.
9. Click a link of the dashboard content.
10. Make sure that the link opens its page. This proves that the dashboard is usable.

Expected result: the modal opens, closes with the close button and leaves the dashboard
usable.

Notes:
- Use page-object-model/components/user-help-modal.components.ts.
- Do not select the option "Please do not show this popup again". That option changes the
  account state for all other tests.
```

---

## D-02 — The help modal stays closed after the user refuses it

**Covers:** TC-DASH-002 · **Priority:** Medium · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-DASH-002 in specs/dashboard/dashboard.md
Test file: tests/dashboard/help-modal-stays-closed.spec.ts
Fixture: @fixtures/auth
Describe title: Dashboard
Test title: The help modal stays closed after the user refuses it

Warning: this test changes a user preference. Use a disposable account or set the
preference back in the cleanup.

Steps:
1. Make a disposable user. Use the sign-up flow or an API seed.
2. Log in as that user.
3. Make sure that the modal "Need some help?" is visible.
4. Select the option "Please do not show this popup again".
5. Make sure that the button "Confirm" is on.
6. Click "Confirm".
7. Make sure that the modal is not visible.
8. Log out.
9. Log in as the same user again.
10. Make sure that the modal does not appear.
11. Make sure that the dashboard content is available immediately.

Cleanup:
12. Remove the disposable user or set the preference back.

Expected result: the refusal of the modal stays after a new login.
```

---

## D-03 — The dashboard shows the status of the organization

**Covers:** TC-DASH-003 · **Priority:** CRITICAL · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-DASH-003 in specs/dashboard/dashboard.md
Test file: tests/dashboard/dashboard-shows-the-organization-status.spec.ts
Fixture: @fixtures/auth
Describe title: Dashboard
Test title: The dashboard shows the status of the organization

Steps:
1. Log in as the admin user.
2. Close the help modal.
3. Make sure that the URL is /dashboard.
4. Make sure that the job counters are visible: Running, Successful, Partial, Skipped and
   Failed.
5. Make sure that the clusters card holds the headings Configured, Healthy and Protected.
6. Make sure that the cloud providers card holds the links Google, Azure and Amazon.
7. Make sure that the databases card holds the counters of the accounts and of the
   protected databases.
8. Make sure that the shortcuts panel and the alerts panel are visible.
9. Make sure that no card shows an error state.
10. Click the link of the clusters card.
11. Make sure that the URL is /clusters.
12. Make sure that the number of the rows agrees with the counter "Configured".

Expected result: the dashboard gives a correct summary and its cards take the user to the
data.

Notes:
- Get the expected counts from the API with the ccApi fixture.
- Compare the counts with the numbers of the cards.
```

---

## D-04 — The jobs table changes with the tab and with the time range

**Covers:** TC-DASH-004, TC-DASH-007 · **Priority:** High · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-DASH-004 and TC-DASH-007 in specs/dashboard/dashboard.md
Test file: tests/dashboard/jobs-table-follows-the-tab-and-the-range.spec.ts
Fixture: @fixtures/auth
Describe title: Dashboard
Test title: The jobs table changes with the tab and with the time range

Steps:
1. Log in as the admin user.
2. Close the help modal.
3. Make sure that the tab "Activity" shows the columns Job name, Type, Message, Started,
   Duration and Status.
4. Click the tab "Cluster backups".
5. Make sure that the URL query holds activeTab=backups.
6. Make sure that the table of the cluster backups is visible.
7. Click the tab "Database backups".
8. Make sure that the table of the database backups is visible.
9. Click the tab "Activity" again.
10. Make sure that the columns of the step 3 come back.
11. Make sure that the page did not do a full reload during the steps 4 to 9.
12. Open the selector "last 24h".
13. Select a different range.
14. Make sure that the button shows the new range.
15. Make sure that the jobs table reads the data again.

Expected result: a tab and a range change the content of the table without a full reload.

Notes:
- Watch the API request of the jobs to prove the new read in step 15.
```

---

## D-05 — The jobs filters find a job

**Covers:** TC-DASH-005 · **Priority:** Medium · **Blocked by:** a job history in the organization

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-DASH-005 in specs/dashboard/dashboard.md
Test file: tests/dashboard/jobs-filters-find-a-job.spec.ts
Fixture: @fixtures/auth
Describe title: Dashboard
Test title: The jobs filters find a job

Precondition: the organization has at least one job in the last 24 hours.
If there is no job, mark the test with test.fixme() and write one comment.

Steps:
1. Log in as the admin user.
2. Close the help modal.
3. Read the name of the first job of the tab "Activity".
4. Type that name in the filter "Job name".
5. Make sure that the table shows only the rows with that name.
6. Type a string that no job uses.
7. Make sure that the table shows the empty state.
8. Clear the name filter.
9. Open the dropdown "Status: All" and select one status.
10. Make sure that each row has that status.
11. Make sure that the counter "Filter 1" is visible.
12. Click the cross of the counter.
13. Make sure that the full list comes back.

Expected result: the filters work together and the clear action gives the full list back.
```

---

## D-06 — Each shortcut opens its target

**Covers:** TC-DASH-006, TC-CL-004, TC-BAK-005 · **Priority:** High · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-DASH-006 in specs/dashboard/dashboard.md. The prompt also covers the deep
links of TC-CL-004 and TC-BAK-005.
Test file: tests/dashboard/shortcuts-open-their-targets.spec.ts
Fixture: @fixtures/auth
Describe title: Dashboard
Test title: Each shortcut opens its target

Steps:
1. Log in as the admin user.
2. Close the help modal.
3. Make sure that the shortcuts panel holds these items: "Clusters Overview", "Add
   cluster", "Cloud accounts" and "Define cluster backup".
4. Click "Clusters Overview".
5. Make sure that the URL is /clusters.
6. Go back to the dashboard.
7. Click "Add cluster".
8. Make sure that the URL is /clusters?new=true.
9. Make sure that the dialog "Add Cluster" is open.
10. Close the dialog with "Cancel".
11. Go back to the dashboard.
12. Click "Define cluster backup".
13. Make sure that the URL is /clusters/backups?new=true.
14. Make sure that the wizard "Define cluster backup" is open.
15. Close the wizard with "Cancel".
16. Go back to the dashboard and click "Cloud accounts".
17. Make sure that the URL is /configuration/cloud-accounts.

Expected result: each shortcut opens the correct page. A deep link with new=true opens the
dialog directly.

Notes:
- Make sure that no cluster and no backup stay after the test.
```

---

# Group C — Clusters

## C-01 — The user registers a cluster and removes it

**Covers:** TC-CL-002, TC-CL-003, TC-CL-005, TC-CL-007 · **Priority:** CRITICAL · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-CL-003 in specs/clusters/clusters.md. The prompt also covers TC-CL-002,
TC-CL-005 and TC-CL-007 as steps of the same flow.
Test file: tests/clusters/register-a-cluster-and-remove-it.spec.ts
Fixture: @fixtures/auth
Describe title: Clusters
Test title: The user registers a cluster and removes it

Background: the registration of a cluster is the entry point of the product.

Steps:
1. Log in as the admin user.
2. Close the help modal and open /clusters.
3. Click "Add cluster".
4. Make sure that the dialog "Add Cluster" holds the fields Name, Description and tags.
5. Make sure that the button "Register" is off while the name is empty.
6. Make sure that the checkbox "Enable CloudCasa DR" is off and not available. The free
   plan does not give this option.
7. Make a name with testResourceName('cluster').
8. Fill the name and a description.
9. Make sure that the button "Register" is on.
10. Clear the name.
11. Make sure that the button "Register" is off again.
12. Fill the name again and click "Register".
13. Make sure that the application shows the install instructions for the agent.
14. Make sure that the instructions hold a command with the identifier of the cluster.
15. Close the instructions.
16. Make sure that the clusters table holds the new cluster.
17. Make sure that the state of the cluster is "Pending" or an equal not-connected state.
18. Open the actions menu of that row and click the remove action.
19. Make sure that a confirmation dialog names the cluster.
20. Confirm the removal.
21. Reload the page.
22. Make sure that the row is not in the table.

Cleanup:
23. Delete the cluster through the API if a step after step 12 fails.

Expected result: the registration makes a cluster with an install command. The removal
needs a confirmation and leaves no row.

Notes:
- Add a clusters module to utils/api/ for the cleanup if the module is not there.
- Read the skill cloudcasa-page-objects before you add the page object of the clusters page.
```

---

## C-02 — The install manifest holds a pull secret and a good image tag

**Covers:** TC-CL-008 · **Priority:** CRITICAL · **Blocked by:** — · **Jira:** CC-549, CC-550, CC-551, CC-811

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-CL-008 in specs/clusters/clusters.md
Test file: tests/clusters/install-manifest-holds-the-pull-secret.spec.ts
Fixture: @fixtures/auth
Describe title: Clusters
Test title: The install manifest holds a pull secret and a good image tag

Background: the tickets CC-549, CC-550 and CC-551 report an agent install failure. The
manifest of the dashboard has no imagePullSecret, so the pod gets ImagePullBackOff. The
ticket CC-811 reports an image tag that the registry does not hold.

Steps:
1. Log in as the admin user.
2. Register a disposable cluster. Use the flow of the prompt C-01.
3. Get the install manifest. Download the file or copy the text of the instructions.
4. Parse the YAML text.
5. Make sure that the pod specification of the agent holds imagePullSecrets.
6. Make sure that the manifest holds the referenced Secret, or that the Secret is named.
7. Read the image reference of the agent.
8. Make sure that the reference holds a registry, a repository and a tag.
9. Make sure that no part of the reference is empty.
10. Ask the registry for the manifest of that tag with an HTTP request.
11. Make sure that the registry answers that the tag exists.
12. Make sure that the clusters table holds the new cluster.

Cleanup:
13. Delete the cluster through the API.

Expected result: the manifest of the user interface always installs. It holds a pull
secret and a tag that the registry has.

Notes:
- Use a YAML parser. Add the dependency if the repository does not have one.
- Do not install the agent. No Kubernetes cluster is necessary for this test.
```

---

## C-03 — The clusters filters find one cluster

**Covers:** TC-CL-006 · **Priority:** Medium · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-CL-006 in specs/clusters/clusters.md
Test file: tests/clusters/clusters-filters-find-one-cluster.spec.ts
Fixture: @fixtures/auth
Describe title: Clusters
Test title: The clusters filters find one cluster

Steps:
1. Make two disposable clusters through the API. Use testResourceName('cluster') for each
   name.
2. Log in as the admin user and open /clusters.
3. Make sure that the table holds the two clusters.
4. Type the name of the first cluster in the filter "Name".
5. Make sure that the table shows one row only. That row is the first cluster.
6. Type a name that no cluster uses.
7. Make sure that the table shows the empty state.
8. Clear the name filter.
9. Select a value in the filter "State".
10. Make sure that each row has that state.
11. Clear all filters.
12. Make sure that the two clusters are visible again.

Cleanup:
13. Delete the two clusters through the API.

Expected result: each filter narrows the list and the clear action gives the full list back.

Notes:
- Seed the clusters through the API. The user interface flow is already in the prompt C-01.
```

---

# Group B — Cluster backups and restores

## B-01 — The backup wizard refuses a backup without a cluster

**Covers:** TC-BAK-001, TC-BAK-004 · **Priority:** CRITICAL · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-BAK-001 and TC-BAK-004 in specs/clusters/backups-restores.md
Test file: tests/backups/backup-wizard-needs-a-cluster.spec.ts
Fixture: @fixtures/auth
Describe title: Cluster Backups
Test title: The backup wizard refuses a backup without a cluster

Steps:
1. Log in as the admin user.
2. Close the help modal and open /clusters/backups.
3. Make sure that the table holds the columns Backup name, Cluster, Policy, Last run and
   Last 3 runs.
4. Type a name that no backup uses in the filter "Backup name".
5. Make sure that the table shows the empty state.
6. Clear the filter.
7. Click "Define backup".
8. Make sure that the wizard holds the steps Cluster, Selections, App hooks, Policy and
   Summary.
9. Make sure that the steps 2 to 5 of the wizard are not available while no cluster is
   selected.
10. Make sure that the buttons "Next" and "Create" are off.
11. Click "Cancel".
12. Make sure that the wizard is closed.
13. Reload the page.
14. Make sure that the table holds no new backup.

Expected result: the wizard cannot go on without a cluster. The cancel makes nothing.
```

---

## B-02 — The user defines a cluster backup

**Covers:** TC-BAK-002 · **Priority:** CRITICAL · **Blocked by:** a connected Kubernetes cluster

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-BAK-002 in specs/clusters/backups-restores.md
Test file: tests/backups/define-a-cluster-backup.spec.ts
Fixture: @fixtures/auth
Describe title: Cluster Backups
Test title: The user defines a cluster backup

Precondition: the organization has one connected cluster in the state Active.
If there is no such cluster, mark the test with test.fixme() and write one comment.

Steps:
1. Log in as the admin user and open /clusters/backups.
2. Click "Define backup".
3. Select the test cluster on the step Cluster. Click "Next".
4. Select "Full cluster" on the step Selections. Click "Next".
5. Do not add a hook on the step App hooks. Click "Next".
6. Select "Run on demand" on the step Policy. Click "Next".
7. Make a name with testResourceName('backup') and fill it on the step Summary.
8. Make sure that the summary shows the cluster and the selections of the steps 3 and 4.
9. Click "Create".
10. Make sure that the table holds the new backup.
11. Make sure that the columns Cluster and Policy hold the correct values.
12. Reload the page and make sure that the row stays.

Cleanup:
13. Delete the backup definition through the API.

Expected result: the wizard makes a backup definition with the correct values.
```

---

## B-03 — A backup runs and makes a recovery point

**Covers:** TC-BAK-003, TC-RP-001 · **Priority:** CRITICAL · **Blocked by:** a connected Kubernetes cluster

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-BAK-003 and TC-RP-001 in specs/clusters/backups-restores.md
Test file: tests/backups/run-a-backup-and-get-a-recovery-point.spec.ts
Fixture: @fixtures/auth
Describe title: Cluster Backups
Test title: A backup runs and makes a recovery point

Precondition: one connected cluster and one backup definition.
Make the backup definition through the API in the arrange step.

Steps:
1. Log in as the admin user and open /clusters/backups.
2. Open the actions of the backup and click "Run now".
3. Make sure that a job appears with the state in progress.
4. Open the dashboard and make sure that the tab Activity holds the same job.
5. Wait for the end of the job. Use a named timeout from @data/timeouts.
6. Make sure that the status of the job is "Successful".
7. Make sure that the column "Last run" of the backup shows the new time.
8. Open /clusters/recovery-points.
9. Make sure that the list holds a recovery point of that backup.
10. Make sure that the recovery point names the correct cluster.

Cleanup:
11. Delete the backup definition and its recovery point through the API.

Expected result: an on-demand run ends with the status Successful and makes one recovery
point.

Notes:
- Add a named timeout for the backup job. Do not write a number in the test.
```

---

## B-04 — The user restores a recovery point

**Covers:** TC-RST-001, TC-RST-002 · **Priority:** CRITICAL · **Blocked by:** a connected Kubernetes cluster

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-RST-001 and TC-RST-002 in specs/clusters/backups-restores.md
Test file: tests/restores/restore-a-recovery-point.spec.ts
Fixture: @fixtures/auth
Describe title: Restores
Test title: The user restores a recovery point

Background: the restore is the reason for each backup. This flow has the highest value.

Precondition: one successful backup with one recovery point.
Make the backup through the API in the arrange step.

Steps:
1. Log in as the admin user and open /clusters/recovery-points.
2. Find the recovery point of the test backup.
3. Start a restore from that recovery point.
4. Select the target cluster and the target namespace.
5. Complete the wizard and start the restore.
6. Open /clusters/restores.
7. Make sure that the table holds the new restore job.
8. Make sure that the tab Activity of the dashboard holds the same job.
9. Wait for the end of the job.
10. Make sure that the status is "Successful".
11. Open the details of the job.
12. Make sure that the details name the restored resources.

Cleanup:
13. Remove the restored namespace and the test backup through the API.

Expected result: the restore ends with the status Successful and reports the resources.
```

---

# Group P — Policies

## P-01 — The user changes a policy and the change stays

**Covers:** TC-POL-003 · **Priority:** High · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-POL-003 in specs/configuration/policies.md
Test file: tests/policies/edit-a-policy-keeps-the-change.spec.ts
Fixture: @fixtures/auth
Describe title: Policies
Test title: The user changes a policy and the change stays

Background: a policy drives each scheduled backup. A lost change stops the protection
silently.

Steps:
1. Make one daily policy through the API. Use testResourceName('policy') for the name.
2. Push the name to the fixture createdPolicies.
3. Log in as the admin user and open /configuration/policies.
4. Make sure that the table holds the policy with its first values.
5. Open the edit action of that row.
6. Change the timezone to a different value.
7. Change the time of the schedule.
8. Save the dialog.
9. Make sure that a success toast appears.
10. Make sure that the columns Schedules and Timezone show the new values.
11. Reload the page.
12. Make sure that the new values stay.
13. Open the edit action again.
14. Make sure that the dialog shows the new values in its fields.
15. Close the dialog.

Cleanup:
16. The fixture createdPolicies deletes the policy.

Expected result: the change goes to the backend and stays after a reload.

Notes:
- Use the values in @data/policies.ts. Do not write a timezone in the test.
- Use page-object-model/components/dialogs/add-policy.dialog.ts. Extend it for the edit
  action after you read the skill cloudcasa-page-objects.
```

---

## P-02 — The policies filter finds one policy of many

**Covers:** TC-POL-005, TC-POL-002 · **Priority:** Low · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-POL-005 in specs/configuration/policies.md. The prompt also covers
TC-POL-002 as a step of the same flow.
Test file: tests/policies/policies-filter-finds-one-policy.spec.ts
Fixture: @fixtures/auth
Describe title: Policies
Test title: The policies filter finds one policy of many

Steps:
1. Make three policies through the API. Use testResourceName('policy') for each name.
2. Push the three names to the fixture createdPolicies.
3. Log in as the admin user and open /configuration/policies.
4. Click "Add policy".
5. Keep the name field empty.
6. Make sure that the save button is off or that the dialog shows a field message.
7. Click "Cancel".
8. Make sure that the table holds the three policies of the step 1.
9. Type the name of the first policy in the filter.
10. Make sure that the table shows that policy only.
11. Type a string that no policy uses.
12. Make sure that the table shows the empty state.
13. Clear the filter.
14. Make sure that the three policies come back.

Cleanup:
15. The fixture createdPolicies deletes the policies.

Expected result: the dialog refuses a policy without a name. The filter narrows the list
and gives it back.
```

---

# Group S — Backup storage

The storage area has the most support tickets. Give these prompts a high priority.

## S-01 — The wizard refuses a bad endpoint URL and accepts a good one

**Covers:** TC-STG-002 · **Priority:** CRITICAL · **Blocked by:** — · **Jira:** CC-659 to CC-663

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-STG-002 in specs/configuration/storage.md. The accepted formats are
automated. This prompt adds the refused formats.
Test file: tests/storage/object-storage-refuses-a-bad-endpoint.spec.ts
Fixture: @fixtures/auth
Describe title: Backup Storage
Test title: The wizard refuses a bad endpoint URL and accepts a good one

Background: the POC thread CC-659 to CC-663 reports that the user interface refuses an
endpoint that the MinIO client accepts. The wizard must refuse bad text only.

Steps:
1. Log in as the admin user and open /configuration/mystorage.
2. Click "Add storage".
3. Keep the answer "No" on the step General. Click "Next".
4. Fill a bucket name, an access key and a secret key on the step Provider.
5. Fill the endpoint field with the text "https://s3 example.com". The text holds a space.
6. Make sure that the field shows a validation message.
7. Make sure that the button "Next" is off.
8. Fill the endpoint field with the text "https://". The text has no host.
9. Make sure that the field shows a validation message again.
10. Fill the endpoint field with a good value. Use an entry of @data/storage.ts.
11. Make sure that the validation message goes away.
12. Make sure that the button "Next" is on.
13. Go to the step Summary.
14. Make sure that the summary shows the endpoint of the step 10.
15. Close the wizard with the cancel action.
16. Make sure that the table holds no new storage.

Expected result: the wizard refuses text that is not a URL. The wizard accepts each good
format of the S3 ecosystem.

Notes:
- The accepted formats are in tests/storage/object-storage-rejects-invalid-targets.spec.ts.
  Do not write them a second time.
- If the wizard accepts the bad text, mark the test with test.fixme() and write one comment.
```

---

## S-02 — An isolated storage needs a proxy cluster

**Covers:** TC-STG-006 · **Priority:** High · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-STG-006 in specs/configuration/storage.md. The prompt also covers the step 4
of TC-STG-001.
Test file: tests/storage/isolated-storage-needs-a-proxy-cluster.spec.ts
Fixture: @fixtures/auth
Describe title: Backup Storage
Test title: An isolated storage needs a proxy cluster

Steps:
1. Log in as the admin user and open /configuration/mystorage.
2. Click "Add storage".
3. Make sure that the answer of the isolated storage question is "No" by default.
4. Make sure that the proxy cluster selection is not necessary with the answer "No".
5. Select the answer "Yes".
6. Make sure that the proxy cluster selection becomes necessary.
7. Make sure that the button "Next" is off while no proxy cluster is selected.
8. Select the answer "No" again.
9. Make sure that the button "Next" is on again.
10. Go to the step Provider and fill the necessary fields.
11. Make sure that the step Summary shows the answer "No" for the isolated storage.
12. Close the wizard with the cancel action.
13. Make sure that the table holds no new storage.

Expected result: an isolated storage cannot go on without a proxy cluster. A normal
storage needs no cluster.
```

---

## S-03 — The provider switch does not keep old values

**Covers:** TC-STG-007 · **Priority:** High · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-STG-007 in specs/configuration/storage.md. The steps 1 and 2 are automated.
This prompt adds the step 3.
Test file: tests/storage/provider-switch-clears-the-fields.spec.ts
Fixture: @fixtures/auth
Describe title: Backup Storage
Test title: The provider switch does not keep old values

Steps:
1. Log in as the admin user and open /configuration/mystorage.
2. Open the wizard and go to the step Provider.
3. Select the provider "AWS / S3 (compatible)".
4. Fill the bucket name, the endpoint, the access key and the secret key.
5. Select the provider "Azure".
6. Make sure that the S3 fields are not visible.
7. Make sure that the Azure fields are visible.
8. Make sure that the button "Next" is off while the Azure fields are empty.
9. Select the provider "AWS / S3 (compatible)" again.
10. Make sure that no field holds a value of the Azure form.
11. Make sure that the validation state is correct for the S3 form.
12. Fill the S3 fields again and go to the step Summary.
13. Make sure that the summary names the provider S3 only.
14. Save the storage.
15. Make sure that the table row shows the provider and the bucket of the step 12.

Cleanup:
16. Push the name to the fixture createdObjectStorages before the save.

Expected result: a provider switch gives the correct fields. No value moves from one
provider to the other one.

Notes:
- Use the catalog in @data/storage.ts for the values.
- Skip the test if the credentials of the target are not in the environment.
```

---

## S-04 — The TLS option stays on the saved storage

**Covers:** TC-STG-008 · **Priority:** Medium · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-STG-008 in specs/configuration/storage.md
Test file: tests/storage/tls-option-stays-on-the-storage.spec.ts
Fixture: @fixtures/auth
Describe title: Backup Storage
Test title: The TLS option stays on the saved storage

Background: a MinIO or FreeNAS installation with a self-signed certificate needs this
option.

Steps:
1. Log in as the admin user and open /configuration/mystorage.
2. Open the wizard and go to the step Provider.
3. Make sure that the checkbox "Disable TLS certificate validation" is off by default.
4. Fill the necessary fields from @data/storage.ts.
5. Set the checkbox to on.
6. Go to the step Summary.
7. Make sure that the summary shows the option as on.
8. Push the name to the fixture createdObjectStorages.
9. Save the storage.
10. Make sure that the table holds the new storage.
11. Open the storage again in the user interface.
12. Make sure that the option is still on.
13. Reload the page and do the step 11 and the step 12 again.

Cleanup:
14. The fixture createdObjectStorages deletes the storage.

Expected result: the option goes to the backend and stays on the saved storage.
```

---

## S-05 — A storage with an unknown bucket gives a bucket error

**Covers:** TC-STG-004 · **Priority:** CRITICAL · **Blocked by:** — · **Jira:** CC-763

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: the step 2 of TC-STG-004 in specs/configuration/storage.md. The other failure
modes are automated.
Test file: tests/storage/object-storage-reports-an-unknown-bucket.spec.ts
Fixture: @fixtures/auth
Describe title: Backup Storage
Test title: A storage with an unknown bucket gives a bucket error

Background: the ticket CC-763 reports the message "Error in accessing bucket" for a bucket
with correct permissions. Each failure mode must name its own cause.

Precondition: the good credentials of the staging AWS bucket.
Skip the test if the environment does not hold them.

Steps:
1. Log in as the admin user and open /configuration/mystorage.
2. Open the wizard and go to the step Provider.
3. Fill the good endpoint, the good access key and the good secret key.
4. Fill a bucket name that does not exist. Use testResourceName('bucket').
5. Go to the step Summary and save.
6. Make sure that the POST of /api/v1/objectstores answers with the status 422.
7. Make sure that the message names the bucket as the cause.
8. Make sure that the message is not a general error.
9. Make sure that the message is different from the message of the bad credentials.
10. Make sure that the wizard stays open.
11. Make sure that the fields keep their values.
12. Correct the bucket name to the good bucket and save again.
13. Make sure that the storage goes to the table.

Cleanup:
14. Push the name to the fixture createdObjectStorages before the step 12.

Expected result: each failure mode gives its own message. The user can correct the input
in the same wizard.

Notes:
- Compare the message with the message of
  tests/storage/object-storage-reports-credentials-failure.spec.ts.
```

---

## S-06 — The user adds an NFS file storage

**Covers:** TC-STG-010 · **Priority:** High · **Blocked by:** an NFS target

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-STG-010 in specs/configuration/storage.md
Test file: tests/storage/adds-nfs-file-storage.spec.ts
Fixture: @fixtures/auth
Describe title: Backup Storage
Test title: The user adds an NFS file storage

Precondition: an NFS server and an export path in the environment.
Skip the test if the environment does not hold them.

Steps:
1. Log in as the admin user and open /configuration/mystorage.
2. Click the tab "File storage".
3. Click "Add storage".
4. Make sure that the form holds the server field and the export path field.
5. Make sure that the save button is off while the necessary fields are empty.
6. Fill the server and the export path of the environment.
7. Make a name with testResourceName('nfs') and fill it.
8. Push the name to the cleanup list.
9. Save the storage.
10. Make sure that the table of the file storage holds the new row.
11. Reload the page and make sure that the row stays.
12. Remove the storage in the user interface and confirm the removal.
13. Make sure that the row is not in the table.

Expected result: the file storage flow validates and saves like the object storage flow.
```

---

## S-07 — The storage shows a positive reachability mark

**Covers:** TC-STG-005 · **Priority:** CRITICAL · **Blocked by:** a connected Kubernetes cluster · **Jira:** CC-770

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-STG-005 in specs/configuration/storage.md
Test file: tests/storage/storage-shows-the-reachability-mark.spec.ts
Fixture: @fixtures/auth
Describe title: Backup Storage
Test title: The storage shows a positive reachability mark

Background: the ticket CC-770 reports that the green mark appears only with a proxy
cluster. The asynchronous validation needs a connected cluster. Without a cluster the
resource keeps the state VALIDATING, and the test cannot tell the two causes apart.

Precondition: the organization has one connected cluster.
If there is no connected cluster, mark the test with test.fixme() and write one comment.

Steps:
1. Log in as the admin user and open /configuration/mystorage.
2. Add a reachable S3 storage. Do not select a proxy cluster.
3. Push the name to the fixture createdObjectStorages.
4. Make sure that the table holds the new storage.
5. Wait for the end of the validation. Use a named timeout from @data/timeouts.
6. Make sure that the column Status shows a positive value.
7. Make sure that the mark next to the name is positive.
8. Open the details of the storage.
9. Make sure that the details also show the positive state.

Cleanup:
10. The fixture createdObjectStorages deletes the storage.

Expected result: the status shows the true reachability. A proxy cluster is not necessary
for the mark.
```

---

# Group U — Users, roles and API keys

## U-01 — The admin invites a user, sees the role and revokes the invitation

**Covers:** TC-USR-001, TC-USR-003, TC-USR-004, TC-ROLE-001 · **Priority:** High · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-USR-004 in specs/configuration/user-management.md. The prompt also covers
TC-USR-001, TC-USR-003 and TC-ROLE-001 as steps of the same flow.
Test file: tests/organization/revoke-a-pending-invitation.spec.ts
Fixture: @fixtures/auth
Describe title: Organization
Test title: The admin invites a user, sees the role and revokes the invitation

Precondition: use the inbox of the owning test file only. Add a new constant to
MailinatorInbox if the flow needs a new inbox. Request the mailboxAccess fixture.

Steps:
1. Log in as the admin user and open /configuration/users.
2. Make sure that the page holds the tabs Users and Invitations.
3. Make sure that the row of the admin user shows the e-mail of CC_EMAIL and the role ADMIN.
4. Open /configuration/roles.
5. Make sure that the page lists the built-in roles with their descriptions.
6. Make sure that a built-in role has no delete action.
7. Go back to /configuration/users and click "Invite user".
8. Send the form with an empty e-mail.
9. Make sure that the form blocks the submit.
10. Fill an e-mail without an at sign.
11. Make sure that the form blocks the submit again.
12. Fill the Mailinator address of the test inbox and select a role.
13. Send the invitation.
14. Make sure that the tab Invitations holds the invitation with the correct e-mail and role.
15. Open the actions of the invitation and click the revoke action.
16. Make sure that a confirmation dialog appears.
17. Confirm the revoke.
18. Make sure that the invitation is not in the list.
19. Read the accept link from the inbox.
20. Open the link in a clean context.
21. Make sure that the application refuses the revoked link.

Cleanup:
22. Cancel the invitation through the API before the test and after the test.

Expected result: the form blocks a bad e-mail. A revoked invitation goes away and its link
stops.

Notes:
- The happy path of the invitation is in tests/organization/invite-to-organization.spec.ts.
- Keep the number of the Mailinator calls low.
```

---

## U-02 — An invited user sees the organization and its resources

**Covers:** TC-USR-005 · **Priority:** CRITICAL · **Blocked by:** — · **Jira:** CC-651, CC-652, CC-655, CC-724

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-USR-005 in specs/configuration/user-management.md. The steps 1 and 2 are
automated. This prompt adds the steps 3 to 7.
Test file: tests/organization/invited-user-sees-the-organization.spec.ts
Fixture: @fixtures/auth
Describe title: Organization
Test title: An invited user sees the organization and its resources

Background: the tickets CC-651, CC-652, CC-655 and CC-724 report that an invited user does
not see the organization and its resources.

Precondition: the registered staging user of MailinatorInbox.INVITE_REGISTERED.
Use that account. A new sign-up is not possible, because a live reCAPTCHA stops the form.
Use the fixture cleanRegisteredUserState.

Steps:
1. Send an invitation to the registered user through the API. Select a member role.
2. Read the accept link from the inbox with @utils/mailinator.ts.
3. Open the link in a clean browser context.
4. Accept the invitation.
5. Log in as the registered user in that context.
6. Make sure that the organization button shows the organization of the admin user.
7. Open /clusters and make sure that the list opens without an access error.
8. Open /configuration/policies and make sure that the list opens without an access error.
9. Log in as the admin user in the first context.
10. Open /configuration/users.
11. Make sure that the table holds the invited user with the correct role.

Cleanup:
12. The fixture cleanRegisteredUserState removes the user and cancels the invitation.

Expected result: a new member gets the correct organization and its resources immediately.
```

---

## U-03 — The user makes an API key and deletes it

**Covers:** TC-KEY-001 · **Priority:** High · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-KEY-001 in specs/configuration/user-management.md
Test file: tests/organization/api-key-lifecycle.spec.ts
Fixture: @fixtures/auth
Describe title: Organization
Test title: The user makes an API key and deletes it

Warning: the free plan gives one API key only. Delete the key in the cleanup. A key that
stays blocks the prompt U-04 and each later run.

Steps:
1. Log in as the admin user and open /configuration/api-keys.
2. Read the quota heading. The heading has the form "API keys N of M created".
3. Click "New API key".
4. Make a name with testResourceName('key') and fill it.
5. Select a role and save.
6. Make sure that the application shows the secret one time.
7. Copy the secret value.
8. Make sure that the table holds the key with its name, role and creation time.
9. Make sure that the quota heading shows one more key.
10. Send one API request with the new key.
11. Make sure that the API accepts the key.
12. Delete the key in the user interface and confirm the deletion.
13. Make sure that the row is not in the table.
14. Make sure that the quota heading shows one key less.

Cleanup:
15. Delete the key through the API if a step after step 5 fails.

Expected result: a new key works immediately and the deletion gives the quota back.
```

---

## U-04 — The free plan stops the second API key

**Covers:** TC-KEY-002 · **Priority:** Medium · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-KEY-002 in specs/configuration/user-management.md
Test file: tests/organization/api-key-quota-on-the-free-plan.spec.ts
Fixture: @fixtures/auth
Describe title: Organization
Test title: The free plan stops the second API key

Precondition: the organization has no API key at the start.
Delete each key with the prefix aqa- through the API in the arrange step.

Steps:
1. Log in as the admin user and open /configuration/api-keys.
2. Make sure that the heading shows "API keys 0 of 1 created".
3. Make one API key. Use testResourceName('key') for the name.
4. Make sure that the heading shows "API keys 1 of 1 created".
5. Try to make a second key.
6. Make sure that the button "New API key" is off, or that the application refuses the
   second key with a message about the plan.
7. Make sure that the table holds one key only.
8. Delete the key and confirm the deletion.
9. Make sure that the button "New API key" is on again.

Cleanup:
10. Delete each key with the prefix aqa- through the API.

Expected result: the user interface holds the quota of the plan and gives it back after a
deletion.
```

---

# Group G — Cloud accounts, audit log, settings and hooks

## G-01 — The cloud account dialog asks for the fields of each provider

**Covers:** TC-CA-001, TC-CA-002 · **Priority:** High · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-CA-001 and TC-CA-002 in specs/configuration/cloud-accounts-misc.md
Test file: tests/cloud-accounts/cloud-account-dialog-per-provider.spec.ts
Fixture: @fixtures/auth
Describe title: Cloud Accounts
Test title: The cloud account dialog asks for the fields of each provider

Steps:
1. Log in as the admin user.
2. Open /configuration/cloud-accounts?provider_type=aws.
3. Make sure that the provider filter holds the value AWS.
4. Do the step 2 and the step 3 again for azure and for gcp.
5. Clear the filter.
6. Click "Add cloud account".
7. Make sure that the dialog offers AWS, Azure and GCP.
8. Select AWS and make sure that the AWS fields are visible.
9. Make sure that the submit is off while the necessary fields are empty.
10. Select Azure and make sure that the Azure fields replace the AWS fields.
11. Select GCP and make sure that the GCP fields are visible.
12. Click "Cancel".
13. Reload the page.
14. Make sure that the table holds no new account.

Expected result: each provider has its own fields and its own validation. The cancel makes
nothing. The query parameter drives the filter of the dashboard links.
```

---

## G-02 — The user links a real cloud account

**Covers:** TC-CA-003 · **Priority:** High · **Blocked by:** cloud credentials

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-CA-003 in specs/configuration/cloud-accounts-misc.md
Test file: tests/cloud-accounts/link-a-cloud-account.spec.ts
Fixture: @fixtures/auth
Describe title: Cloud Accounts
Test title: The user links a real cloud account

Precondition: the credentials of one test cloud account in the environment.
Skip the test if the environment does not hold them.

Steps:
1. Log in as the admin user and open /configuration/cloud-accounts.
2. Click "Add cloud account" and select the provider of the credentials.
3. Make a name with testResourceName('cloud') and fill the necessary fields.
4. Push the name to the cleanup list.
5. Save the account.
6. Make sure that the table holds the new account.
7. Wait for the state Active. Use a named timeout from @data/timeouts.
8. Make sure that the column "Last inventory time" holds a time.
9. Open /databases.
10. Make sure that the page holds the databases of the inventory.
11. Remove the account in the user interface and confirm the removal.
12. Make sure that the row is not in the table.

Cleanup:
13. Delete the account through the API.

Expected result: the account links, makes an inventory and shows its resources.
```

---

## G-03 — The audit log records a policy change

**Covers:** TC-AUD-001 · **Priority:** High · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-AUD-001 in specs/configuration/cloud-accounts-misc.md
Test file: tests/configuration/audit-log-records-a-policy-change.spec.ts
Fixture: @fixtures/auth
Describe title: Configuration
Test title: The audit log records a policy change

Background: the audit log is a compliance function. A silent failure is expensive.

Steps:
1. Log in as the admin user and open /configuration/policies.
2. Make one policy in the user interface. Use testResourceName('policy') for the name.
3. Push the name to the fixture createdPolicies.
4. Delete the same policy in the user interface.
5. Open /configuration/audit-logs.
6. Make sure that the log holds one entry for the creation of that policy.
7. Make sure that the log holds one entry for the deletion of that policy.
8. Make sure that each entry names the admin user.
9. Make sure that each entry holds a time of the test run.
10. Filter the log by the name of the user.
11. Make sure that the two entries stay in the list.
12. Filter the log by an action type.
13. Make sure that the list holds that action type only.
14. Clear the filters.

Expected result: the log records each action with the user, the time and the action type.
The filters find the entries again.
```

---

## G-04 — An organization setting stays after a reload

**Covers:** TC-SET-001 · **Priority:** Medium · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-SET-001 in specs/configuration/cloud-accounts-misc.md
Test file: tests/configuration/organization-setting-stays.spec.ts
Fixture: @fixtures/auth
Describe title: Configuration
Test title: An organization setting stays after a reload

Warning: change one setting that does not change the behavior of another test.

Steps:
1. Log in as the admin user and open /configuration/preferences.
2. Make sure that the form shows its current values.
3. Read the value of the setting that the test changes.
4. Change that setting to a different value.
5. Save the form.
6. Make sure that a success toast appears.
7. Reload the page.
8. Make sure that the form shows the new value.
9. Open another page and come back to /configuration/preferences.
10. Make sure that the new value stays.

Cleanup:
11. Set the value of the step 3 back and save.
12. Make sure that the first value is in the form again.

Expected result: a setting goes to the backend and stays. The test leaves the organization
in its first state.
```

---

## G-05 — The hooks page refuses an empty hook

**Covers:** TC-HOOK-001 · **Priority:** Low · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-HOOK-001 in specs/configuration/cloud-accounts-misc.md
Test file: tests/configuration/hooks-refuse-an-empty-hook.spec.ts
Fixture: @fixtures/auth
Describe title: Configuration
Test title: The hooks page refuses an empty hook

Steps:
1. Log in as the admin user and open /configuration/hooks.
2. Make sure that the page shows its heading and its table or its empty state.
3. Open the dialog that adds a hook.
4. Make sure that the save button is off while the necessary fields are empty.
5. Fill the necessary fields with a name from testResourceName('hook').
6. Make sure that the save button is on.
7. Clear one necessary field.
8. Make sure that the save button is off again.
9. Click "Cancel".
10. Reload the page.
11. Make sure that the page holds no new hook.

Expected result: the dialog blocks an incomplete hook and the cancel makes nothing.
```

---

# Group R — Reports, Databases and DR

## R-01 — Each report type gives a result for each granularity

**Covers:** TC-REP-001, TC-REP-002 · **Priority:** High · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-REP-001 and TC-REP-002 in specs/reports/reports.md
Test file: tests/reports/reports-generate-for-each-granularity.spec.ts
Fixture: @fixtures/auth
Describe title: Reports
Test title: Each report type gives a result for each granularity

Steps:
1. Log in as the admin user and open /reports.
2. Make sure that the default report is "Success rate by cluster".
3. Make sure that the granularity list holds Daily, Weekly, Monthly and Yearly.
4. Select the granularity Weekly and click "Generate".
5. Make sure that the report shows a table or a clean empty state.
6. Make sure that the columns agree with the selected period.
7. Do the step 4 to the step 6 again for Daily, Monthly and Yearly.
8. Open the report "Success rate by job definition" and click "Generate".
9. Make sure that the report shows a result.
10. Do the step 8 and the step 9 again for "Last successful run by cluster".
11. Do the step 8 and the step 9 again for "Last successful run by job definition".
12. Do the step 8 and the step 9 again for "Current PVC details".
13. Make sure that no report shows an error state.

Expected result: each report type and each granularity gives a result. An empty
organization gives an empty state and no error.

Notes:
- Put the report names and the granularity values in constant arrays. Use two loops.
```

---

## R-02 — The empty Databases section sends the user to the cloud accounts

**Covers:** TC-DB-001 · **Priority:** Low · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-DB-001 in specs/reports/reports.md
Test file: tests/databases/empty-databases-lead-to-the-cloud-accounts.spec.ts
Fixture: @fixtures/auth
Describe title: Databases
Test title: The empty Databases section sends the user to the cloud accounts

Steps:
1. Log in as the admin user and open /databases.
2. Make sure that the sub-navigation holds Overview, Backups, Restores and Recovery points.
3. Open each sub-tab and make sure that the table or the empty state is visible.
4. Go back to the tab Overview.
5. Make sure that the empty state offers the link "Add cloud account".
6. Click that link.
7. Make sure that the URL is the cloud accounts page.
8. Make sure that the button "Add cloud account" is visible on that page.

Expected result: an empty organization gets a clear next action and the link works.

Notes:
- If the organization holds a cloud account, the empty state is not visible.
  Make sure of the state before the step 5.
```

---

## R-03 — The free plan gates the DR section

**Covers:** TC-DR-001 · **Priority:** Low · **Blocked by:** —

```text
Task: write one automated E2E test for CloudCasa.
Obey the COMMON RULES in prompts/e2e-test-prompts.md.

Plan case: TC-DR-001 in specs/reports/reports.md
Test file: tests/dr/free-plan-gates-the-dr-section.spec.ts
Fixture: @fixtures/auth
Describe title: DR
Test title: The free plan gates the DR section

Steps:
1. Log in as the admin user and open /dr.
2. Make sure that the heading is "DR clusters".
3. Make sure that the sub-navigation holds Storage systems, Plans and Recovery jobs.
4. Open each sub-tab and make sure that the page shows its table or its empty state.
5. Make sure that the DR functions show the gate of the free plan.
6. Open /clusters and click "Add cluster".
7. Make sure that the checkbox "Enable CloudCasa DR" is not available.
8. Close the dialog with "Cancel".

Expected result: the DR section opens and the gate of the free plan is the same in the two
places.
```

---

## Maintenance of this file

1. Write one new prompt for each new case in specs/.
2. Move a prompt to the automated list when its test is green in the main branch.
3. Keep the index table and the prompts in agreement.
4. Write each new prompt in Simplified Technical English. Use the same structure.
5. Delete the **Blocked by** value when the infrastructure is available.
