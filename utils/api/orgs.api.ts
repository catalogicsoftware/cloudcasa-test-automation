import { CcApiRoutes } from '@data/api-routes';
import { assertResponseOk } from '@utils/generic';
import { BaseApi } from './base.api';
import type { Org, OrgsListResponse } from '../../types/api/orgs';

export class OrgsApi extends BaseApi {
  /** The static API token belongs to one organization, so the list holds only that one. */
  async current(): Promise<Org> {
    const response = await this.request.get(this.url(CcApiRoutes.ORGS), { headers: this.headers });
    await assertResponseOk(response, 'GET orgs');
    const org = ((await response.json()) as OrgsListResponse)._items[0];
    if (!org) {
      throw new Error('The API token sees no organization');
    }
    return org;
  }

  async setDisplayName(displayName: string): Promise<void> {
    const org = await this.current();
    const response = await this.request.patch(this.url(`${CcApiRoutes.ORGS}/${org._id}`), {
      headers: { ...this.headers, 'If-Match': org._etag },
      data: { display_name: displayName },
    });
    await assertResponseOk(response, `PATCH orgs/${org._id}`);
  }
}
