import { CcApiRoutes } from '@data/api-routes';
import { assertResponseOk } from '@utils/generic';
import { BaseApi } from './base.api';
import type { CreateHookRequest, Hook, HooksListResponse } from '../../types/api/hooks';
import type { HookCase } from '../../types/data/hook';

export class HooksApi extends BaseApi {
  /** Mirrors what the drawer POSTs: one hook entry per app, an empty container left out. */
  async create(hook: HookCase): Promise<Hook> {
    const data: CreateHookRequest = {
      name: hook.name,
      hook_type: hook.type,
      hook: hook.apps.map(app => ({
        target: [
          app.container
            ? { container: app.container, command: app.command }
            : { command: app.command },
        ],
        labels: { [app.podSelector.key]: app.podSelector.value },
      })),
    };
    const response = await this.request.post(this.url(CcApiRoutes.KUBEHOOKS), {
      headers: this.headers,
      data,
    });
    await assertResponseOk(response, 'POST kubehooks');
    return (await response.json()) as Hook;
  }

  async findByName(name: string): Promise<Hook | undefined> {
    const response = await this.request.get(this.url(CcApiRoutes.KUBEHOOKS), {
      headers: this.headers,
      params: { where: JSON.stringify({ name }) },
    });
    await assertResponseOk(response, 'GET kubehooks');
    return ((await response.json()) as HooksListResponse)._items[0];
  }

  async delete(hook: Hook): Promise<void> {
    const response = await this.request.delete(this.url(`${CcApiRoutes.KUBEHOOKS}/${hook._id}`), {
      // Eve REST API rejects DELETE without the resource's current etag.
      headers: { ...this.headers, 'If-Match': hook._etag },
    });
    await assertResponseOk(response, `DELETE kubehooks/${hook._id}`);
  }

  /** Teardown for a created hook, a no-op once the UI removed it. Exact name only — a prefix sweep would hit parallel workers. */
  async deleteByName(name: string): Promise<boolean> {
    const hook = await this.findByName(name);
    if (hook) {
      await this.delete(hook);
    }
    return Boolean(hook);
  }
}
