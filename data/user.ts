import { faker } from '@faker-js/faker';
import { TestmailTag, testmailAddress } from './testmail-tags';
import type { User as UserData, InvitedUser as InvitedUserData } from '../types/data/user';

export class User implements UserData {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly organization: string,
  ) {}
}

export class InvitedUser extends User implements InvitedUserData {
  constructor(
    email: string,
    password: string,
    organization: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly role: string,
    public readonly userGroup?: string,
  ) {
    super(email, password, organization);
  }
}

export const defaultUser = new User(
  process.env.CC_EMAIL ?? '',
  process.env.CC_PASSWORD ?? '',
  'CC AQA Organization',
);

// Receives the organization invitation email (testmail.app inbox). Has no
// password until the invite is accepted and one is set during the test flow.
export const invitedUser = new InvitedUser(
  testmailAddress(TestmailTag.INVITE_PENDING),
  '',
  'CC AQA Organization',
  'AQA',
  'Invited',
  'ADMIN',
);

// The email is a FIXED testmail address (tag INVITE_SIGNUP) — not unique per
// call, same as `invitedUser` above. Repeatability across runs comes from
// cancelSignupInvitationAfterTest cleaning up both before and after the test
// (fixtures/auth.ts), not from the address itself; only the name/password are
// randomized here, so two concurrent runs can still collide on the address.
export const fakeInvitedUser = (): InvitedUser =>
  new InvitedUser(
    testmailAddress(TestmailTag.INVITE_SIGNUP),
    // Suffix guarantees the upper/lower/digit/special mix the password policy wants.
    `${faker.internet.password({ length: 12, memorable: false })}aB1!`,
    'CC AQA Organization',
    faker.person.firstName(),
    faker.person.lastName(),
    'ADMIN',
  );

// Static staging user, manually registered ONCE with this exact testmail
// address and approved for staging access (see docs/superpowers/specs/
// 2026-07-16-invite-registered-user-design.md). Owned exclusively by the
// invite-registered-user test: it is invited into CC AQA Organization and
// removed again by the cleanRegisteredUserState fixture, returning to its
// own default organization.
export const registeredUser = new InvitedUser(
  testmailAddress(TestmailTag.INVITE_REGISTERED),
  process.env.REGISTERED_USER_PASSWORD ?? '',
  'CC AQA Organization',
  'AQA',
  'Registered',
  'ADMIN',
);
