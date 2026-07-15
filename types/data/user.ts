export type User = {
  email: string;
  password: string;
  organization: string;
};

export type InvitedUser = User & {
  firstName: string;
  lastName: string;
  role: string;
  userGroup?: string;
};
