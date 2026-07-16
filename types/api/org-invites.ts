export type OrgInviteState = 'PENDING' | 'DECLINED' | 'EXPIRED' | 'ACCEPTED';

export type OrgInvite = {
  _id: string;
  _etag: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  state: OrgInviteState;
  inviter: string;
  org: string;
  _created: string;
  _updated: string;
};

export type OrgInviteAcl = {
  roles: string[];
  resource: string;
};

export type CreateOrgInviteRequest = {
  acls: OrgInviteAcl[];
  expires_in_days: number;
  first_name: string;
  last_name: string;
  email: string;
};

export type OrgInvitesListResponse = {
  _items: OrgInvite[];
  _meta: {
    page: number;
    max_results: number;
    total: number;
  };
};
