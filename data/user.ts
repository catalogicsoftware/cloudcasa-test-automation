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
  process.env.INVITED_USER_EMAIL ?? '',
  '',
  'CC AQA Organization',
  'AQA',
  'Invited',
  'ADMIN',
);
