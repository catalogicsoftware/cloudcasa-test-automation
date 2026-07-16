import { CcApiRoutes } from '@data/api-routes';
import { BaseApi } from './base.api';
import type {
  CreateOrgInviteRequest,
  OrgInvite,
  OrgInvitesListResponse,
} from '../../types/api/org-invites';
import type { InvitedUser } from '../../types/data/user';

export class OrgInvitesApi extends BaseApi {
  async findByEmail(email: string): Promise<OrgInvite | undefined> {
    const response = await this.request.get(this.url(CcApiRoutes.ORG_INVITES), {
      headers: this.headers,
      params: {
        where: JSON.stringify({ email, state: { $in: ['PENDING', 'DECLINED', 'EXPIRED'] } }),
        sort: '-_created',
      },
    });
    if (!response.ok()) {
      throw new Error(`GET orginvites failed: ${response.status()} ${await response.text()}`);
    }
    const body = (await response.json()) as OrgInvitesListResponse;
    return body._items[0];
  }

  async create(user: InvitedUser, roleIds: string[], expiresInDays = 7): Promise<void> {
    const data: CreateOrgInviteRequest = {
      acls: [{ roles: roleIds, resource: 'allresources' }],
      expires_in_days: expiresInDays,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
    };
    const response = await this.request.post(this.url(CcApiRoutes.ORG_INVITES), {
      headers: this.headers,
      data,
    });
    if (!response.ok()) {
      throw new Error(`POST orginvites failed: ${response.status()} ${await response.text()}`);
    }
  }

  async cancel(invite: OrgInvite): Promise<void> {
    const response = await this.request.delete(
      this.url(`${CcApiRoutes.ORG_INVITES}/${invite._id}`),
      {
        // Eve REST API rejects DELETE without the resource's current etag.
        headers: { ...this.headers, 'If-Match': invite._etag },
      },
    );
    if (!response.ok()) {
      throw new Error(
        `DELETE orginvites/${invite._id} failed: ${response.status()} ${await response.text()}`,
      );
    }
  }

  /** Cancels the invitation for the given email if one exists. Returns true when something was deleted. */
  async cancelByEmail(email: string): Promise<boolean> {
    const invite = await this.findByEmail(email);
    if (!invite) {
      return false;
    }
    await this.cancel(invite);
    return true;
  }
}
