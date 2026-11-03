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
    await this.patch({ display_name: displayName });
  }

  async setYamlCatalogForBrowse(enabled: boolean): Promise<void> {
    await this.patch({ enable_yaml_catalog_for_browse: enabled });
  }

  /** A storage set as the default refuses deletion with 422. This is a no-op when no default is set. */
  async clearDefaultStorage(): Promise<void> {
    const org = await this.current();
    if (!org.backup_provider?.user_objectstore) {
      return;
    }
    // PATCH merges the nested object, so only a full PUT drops the key, like the Settings page does.
    const data = Object.fromEntries(Object.entries(org).filter(([field]) => !field.startsWith('_')));
    const response = await this.request.put(this.url(`${CcApiRoutes.ORGS}/${org._id}`), {
      headers: { ...this.headers, 'If-Match': org._etag },
      data: { ...data, backup_provider: {} },
    });
    await assertResponseOk(response, `PUT orgs/${org._id}`);
  }

  private async patch(data: Partial<Org>): Promise<void> {
    const org = await this.current();
    const response = await this.request.patch(this.url(`${CcApiRoutes.ORGS}/${org._id}`), {
      headers: { ...this.headers, 'If-Match': org._etag },
      data,
    });
    await assertResponseOk(response, `PATCH orgs/${org._id}`);
  }

  /** PATCH merges uiprefs instead of dropping a key, so this PUTs the whole organization like the Settings page does. */
  async enableCloudAccounts(): Promise<void> {
    const org = await this.current();
    const { disabled_cloudaccounts: disabled, ...uiprefs } = org.uiprefs;
    if (disabled === undefined) {
      return;
    }
    const fields = Object.fromEntries(Object.entries(org).filter(([key]) => !key.startsWith('_')));
    const response = await this.request.put(this.url(`${CcApiRoutes.ORGS}/${org._id}`), {
      headers: { ...this.headers, 'If-Match': org._etag },
      data: { ...fields, uiprefs },
    });
    await assertResponseOk(response, `PUT orgs/${org._id}`);
  }
}
