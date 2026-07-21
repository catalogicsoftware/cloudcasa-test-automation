import { CcApiRoutes } from '@data/api-routes';
import { assertResponseOk } from '@utils/generic';
import { BaseApi } from './base.api';
import type { Role, RolesListResponse } from '../../types/api/roles';

export class RolesApi extends BaseApi {
  async findByName(name: string): Promise<Role> {
    const response = await this.request.get(this.url(CcApiRoutes.ROLES), {
      headers: this.headers,
      params: {
        where: JSON.stringify({ name, permissions: { $exists: true } }),
      },
    });
    await assertResponseOk(response, 'GET roles');
    const body = (await response.json()) as RolesListResponse;
    const role = body._items[0];
    if (!role) {
      throw new Error(`Role "${name}" not found`);
    }
    return role;
  }
}
