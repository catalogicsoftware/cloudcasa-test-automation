import { CcApiRoutes } from '@data/api-routes';
import { isTestResourceName } from '@utils/resource-names';
import { assertResponseOk } from '@utils/generic';
import { BaseApi } from './base.api';
import type { ObjectStore, ObjectStoresListResponse } from '../../types/api/object-stores';

export class ObjectStoresApi extends BaseApi {
  private async find(where: Record<string, string>): Promise<ObjectStore[]> {
    const response = await this.request.get(this.url(CcApiRoutes.OBJECT_STORES), {
      headers: this.headers,
      params: { where: JSON.stringify(where) },
    });
    await assertResponseOk(response, 'GET objectstores');
    return ((await response.json()) as ObjectStoresListResponse)._items;
  }

  async findByName(name: string): Promise<ObjectStore | undefined> {
    return (await this.find({ name }))[0];
  }

  async delete(store: ObjectStore): Promise<void> {
    const response = await this.request.delete(
      this.url(`${CcApiRoutes.OBJECT_STORES}/${store._id}`),
      {
        // Eve REST API rejects DELETE without the resource's current etag.
        headers: { ...this.headers, 'If-Match': store._etag },
      },
    );
    await assertResponseOk(response, `DELETE objectstores/${store._id}`);
  }

  /**
   * Teardown for a created storage, a no-op once the UI removed it. Matched on the
   * exact name, never on the prefix: the suite runs fully parallel, so a prefix
   * sweep would delete a storage another worker is still asserting on.
   */
  async deleteByName(name: string): Promise<boolean> {
    const store = await this.findByName(name);
    if (store) {
      await this.delete(store);
    }
    return Boolean(store);
  }

  /**
   * The backend keys storage uniqueness on provider type + region + prefix + bucket
   * rather than the name, so one leftover from a run that died before teardown makes
   * every later run 422. Scoping the sweep to the bucket and to test-generated names
   * keeps it clear of parallel targets and of anything a human created.
   */
  async deleteStaleForBucket(bucket: string): Promise<number> {
    const stale = (await this.find({ bucket_name: bucket })).filter(store =>
      isTestResourceName(store.name),
    );
    for (const store of stale) {
      await this.delete(store);
    }
    return stale.length;
  }
}
