import { CcApiRoutes } from '@data/api-routes';
import { assertResponseOk } from '@utils/generic';
import { BaseApi } from './base.api';
import type { CreatePolicyRequest, PoliciesListResponse, Policy } from '../../types/api/policies';

export class PoliciesApi extends BaseApi {
  /** Defaults give a daily 03:00 schedule for callers that only need a listed policy; no timezone is sent, so the backend uses UTC. */
  async create(name: string, cron = '0 3 */1 * *', retainDays = 7): Promise<Policy> {
    const data: CreatePolicyRequest = {
      name,
      schedules: [{ retainDays, locked: false, schedule: { cronSpec: cron } }],
    };
    const response = await this.request.post(this.url(CcApiRoutes.POLICIES), {
      headers: this.headers,
      data,
    });
    await assertResponseOk(response, 'POST policies');
    return (await response.json()) as Policy;
  }

  async findByName(name: string): Promise<Policy | undefined> {
    const response = await this.request.get(this.url(CcApiRoutes.POLICIES), {
      headers: this.headers,
      params: { where: JSON.stringify({ name }) },
    });
    await assertResponseOk(response, 'GET policies');
    return ((await response.json()) as PoliciesListResponse)._items[0];
  }

  async delete(policy: Policy): Promise<void> {
    const response = await this.request.delete(this.url(`${CcApiRoutes.POLICIES}/${policy._id}`), {
      // Eve REST API rejects DELETE without the resource's current etag.
      headers: { ...this.headers, 'If-Match': policy._etag },
    });
    await assertResponseOk(response, `DELETE policies/${policy._id}`);
  }

  /** Teardown for a created policy, a no-op once the UI removed it. Exact name only — a prefix sweep would hit parallel workers. */
  async deleteByName(name: string): Promise<boolean> {
    const policy = await this.findByName(name);
    if (policy) {
      await this.delete(policy);
    }
    return Boolean(policy);
  }
}
