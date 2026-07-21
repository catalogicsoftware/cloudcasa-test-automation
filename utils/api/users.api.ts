import { APIRequestContext } from '@playwright/test';
import { CcApiRoutes } from '@data/api-routes';
import { assertResponseOk } from '@utils/generic';
import { BaseApi, apiHeaders } from './base.api';
import type { CcUser, UsersListResponse } from '../../types/api/users';

// The /users resource rejects the static API key ("API Key access is not
// allowed for this resource"), so this client authenticates with a Bearer JWT
// captured from a logged-in admin browser session (see the adminJwt fixture).
export class UsersApi extends BaseApi {
  constructor(
    request: APIRequestContext,
    private readonly jwt: string,
  ) {
    super(request);
  }

  protected get headers(): Record<string, string> {
    return apiHeaders(this.jwt);
  }

  async findByEmail(email: string): Promise<CcUser | undefined> {
    const response = await this.request.get(this.url(CcApiRoutes.USERS), {
      headers: this.headers,
      params: { where: JSON.stringify({ email }) },
    });
    await assertResponseOk(response, 'GET users');
    const body = (await response.json()) as UsersListResponse;
    return body._items[0];
  }

  async remove(user: CcUser): Promise<void> {
    const response = await this.request.delete(this.url(`${CcApiRoutes.USERS}/${user._id}`), {
      // Eve REST API rejects DELETE without the resource's current etag.
      headers: { ...this.headers, 'If-Match': user._etag },
    });
    await assertResponseOk(response, `DELETE users/${user._id}`);
  }

  /** Removes the user from the organization if present. Returns true when something was deleted. */
  async removeByEmail(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user) {
      return false;
    }
    await this.remove(user);
    return true;
  }
}
