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

// Accepting an invitation is irreversible — the user joins the organization —
// so tests that accept one need a unique testmail tag per run to stay repeatable.
export const fakeInvitedUser = (): InvitedUser =>
  new InvitedUser(
    testmailAddress(TestmailTag.INVITE_SIGNUP),
    // Suffix guarantees the upper/lower/digit/special mix the password policy wants.
    `${faker.internet.password({ length: 12, memorable: false })}aB1!`,
    'CC AQA Organization',
    'AQA',
    'Invited',
    'ADMIN',
  );
