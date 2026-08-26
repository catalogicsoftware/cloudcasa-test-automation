// Mailinator addresses are `<inbox>@<private domain>`; any inbox exists the moment mail
// arrives for it. Convention: kebab-case `<flow>-<role/state>`, and one inbox = one owning
// test file, so a test only ever sees its own emails and utils/mailinator.ts can wipe the
// inbox before a run without disturbing another test.
export const MailinatorInbox = {
  /** Password-reset account (tests/auth/password-reset-*); a staging account is registered on this address. */
  RESET_PWD: 'test',
  /** Invitee that never accepts (tests/organization/invite-to-organization). */
  INVITE_PENDING: 'invite-pending',
  /** Unregistered invitee for the signup flow (tests/organization/invitation-link-prefills-signup). */
  INVITE_SIGNUP: 'invite-signup',
  /**
   * Static registered staging user (tests/organization/invite-registered-user).
   * Manually registered once — the address is baked into that account, so this
   * inbox must never change.
   */
  INVITE_REGISTERED: 'invite-registered',
} as const;

export type MailinatorInboxName = (typeof MailinatorInbox)[keyof typeof MailinatorInbox];

export const mailboxAddress = (inbox: MailinatorInboxName): string =>
  `${inbox}@${process.env.MAILINATOR_DOMAIN}`;
