import { CcApiRoutes } from '@data/api-routes';
import { assertResponseOk } from '@utils/generic';
import { BaseApi } from './base.api';
import type { DashboardStats } from '../../types/api/dashboard';

export class DashboardApi extends BaseApi {
  async getStats(): Promise<DashboardStats> {
    const response = await this.request.get(this.url(CcApiRoutes.DASHBOARD), {
      headers: this.headers,
    });
    await assertResponseOk(response, 'GET dashboard');
    return (await response.json()) as DashboardStats;
  }
}
