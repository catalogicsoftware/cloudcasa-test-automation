import { APIRequestContext } from '@playwright/test';
import { CcApiRoutes } from '@data/api-routes';
import { assertResponseOk } from '@utils/generic';
import { isTestResourceName } from '@utils/resource-names';
import { BaseApi, apiHeaders } from './base.api';
import type { ApiKey, ApiKeysListResponse } from '../../types/api/api-keys';

// The /apikeys resource refuses writes made with an API key ("Cannot create API keys though API"),
// so this client authenticates with the admin's browser JWT (see the adminJwt fixture), like UsersApi.
export class ApiKeysApi extends BaseApi {
  constructor(
    request: APIRequestContext,
    private readonly jwt: string,
  ) {
    super(request);
  }

  protected get headers(): Record<string, string> {
    return apiHeaders(this.jwt);
  }

  async findByName(name: string): Promise<ApiKey | undefined> {
    const response = await this.request.get(this.url(CcApiRoutes.API_KEYS), {
      headers: this.headers,
      params: { where: JSON.stringify({ name }) },
    });
    await assertResponseOk(response, 'GET apikeys');
    return ((await response.json()) as ApiKeysListResponse)._items[0];
  }

  async delete(key: ApiKey): Promise<void> {
    const response = await this.request.delete(this.url(`${CcApiRoutes.API_KEYS}/${key._id}`), {
      // Eve REST API rejects DELETE without the resource's current etag.
      headers: { ...this.headers, 'If-Match': key._etag },
    });
    await assertResponseOk(response, `DELETE apikeys/${key._id}`);
  }

  /** Teardown for a created key, a no-op once the UI removed it. Exact test names only: the suite's own token is a key too. */
  async deleteByName(name: string): Promise<boolean> {
    if (!isTestResourceName(name)) {
      throw new Error(`Refusing to delete API key "${name}": it was not created by a test`);
    }
    const key = await this.findByName(name);
    if (key) {
      await this.delete(key);
    }
    return Boolean(key);
  }

  /** Sends what an integration holding the key sends: the key itself as the bearer token. */
  async statusWithKey(secret: string): Promise<number> {
    const response = await this.request.get(this.url(CcApiRoutes.API_KEYS), {
      headers: apiHeaders(secret),
      params: { max_results: 1 },
    });
    return response.status();
  }
}
