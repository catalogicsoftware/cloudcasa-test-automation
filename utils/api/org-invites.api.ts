import { CcApiRoutes } from '@data/api-routes';
import { assertResponseOk } from '@utils/generic';
import { BaseApi } from './base.api';
import type {
  CreateOrgInviteRequest,
  OrgInvite,
  OrgInvitesListResponse,
} from '../../types/api/org-invites';
import type { InvitedUser } from '../../types/data/user';

export class OrgInvitesApi extends BaseApi {
  /** All pending/stale invites for the email, newest first — there can be more than one if a prior run's cleanup didn't run. */
  async findAllByEmail(email: string): Promise<OrgInvite[]> {
    const response = await this.request.get(this.url(CcApiRoutes.ORG_INVITES), {
      headers: this.headers,
      params: {
        where: JSON.stringify({ email, state: { $in: ['PENDING', 'DECLINED', 'EXPIRED'] } }),
        sort: '-_created',
      },
    });
    await assertResponseOk(response, 'GET orginvites');
    const body = (await response.json()) as OrgInvitesListResponse;
    return body._items;
  }

  async findByEmail(email: string): Promise<OrgInvite | undefined> {
    return (await this.findAllByEmail(email))[0];
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
    await assertResponseOk(response, 'POST orginvites');
  }

  async cancel(invite: OrgInvite): Promise<void> {
    const response = await this.request.delete(
      this.url(`${CcApiRoutes.ORG_INVITES}/${invite._id}`),
      {
        // Eve REST API rejects DELETE without the resource's current etag.
        headers: { ...this.headers, 'If-Match': invite._etag },
      },
    );
    await assertResponseOk(response, `DELETE orginvites/${invite._id}`);
  }

  /**
   * Cancels EVERY pending/stale invitation for the given email, not just the newest —
   * a crashed prior run can leave more than one, and a stale duplicate row is enough to
   * break Table assertions that match rows by email. Returns true when anything was deleted.
   */
  async cancelByEmail(email: string): Promise<boolean> {
    const invites = await this.findAllByEmail(email);
    for (const invite of invites) {
      await this.cancel(invite);
    }
    return invites.length > 0;
  }
}
