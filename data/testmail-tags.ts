// testmail.app addresses look like `namespace.tag@inbox.testmail.app`; the
// testmail API filters the inbox by tag. Convention: kebab-case
// `<flow>-<role/state>`, and one tag = one owning test file, so filtering by
// tag shows exactly one test's emails and the timestamp filter in
// utils/testmail.ts only guards against re-runs of the same test.
export const TestmailTag = {
  /**
   * Password-reset account (tests/auth/password-reset-*). Registered on
   * staging before this convention existed — legacy name; renaming would
   * require registering a new manually-approved staging account.
   */
  RESET_PWD: 'test',
  /** Invitee that never accepts (tests/organization/invite-to-organization). */
  INVITE_PENDING: 'invite-pending',
  /** Unregistered invitee for the signup flow (tests/organization/invitation-link-prefills-signup). */
  INVITE_SIGNUP: 'invite-signup',
  /**
   * Static registered staging user (tests/organization/invite-registered-user).
   * Manually registered once — the address is baked into that account, so this
   * tag must never change.
   */
  INVITE_REGISTERED: 'invite-registered',
} as const;

export type TestmailTagValue = (typeof TestmailTag)[keyof typeof TestmailTag];

export const testmailAddress = (tag: TestmailTagValue): string =>
  `${process.env.TESTMAIL_NAMESPACE}.${tag}@inbox.testmail.app`;
