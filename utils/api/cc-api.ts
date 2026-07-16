import { APIRequestContext } from '@playwright/test';
import { RolesApi } from './roles.api';
import { OrgInvitesApi } from './org-invites.api';
import type { InvitedUser } from '../../types/data/user';

export class CcApi {
  readonly roles: RolesApi;
  readonly orgInvites: OrgInvitesApi;

  constructor(request: APIRequestContext) {
    this.roles = new RolesApi(request);
    this.orgInvites = new OrgInvitesApi(request);
  }

  /** Resolves the role name to its id and sends an organization invitation. */
  async inviteUser(user: InvitedUser): Promise<void> {
    const role = await this.roles.findByName(user.role);
    await this.orgInvites.create(user, [role._id]);
  }
}
