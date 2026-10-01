import { CcApiRoutes } from '@data/api-routes';
import { assertResponseOk } from '@utils/generic';
import { BaseApi } from './base.api';
import type { Cluster, ClustersListResponse } from '../../types/api/clusters';

export class ClustersApi extends BaseApi {
  async findByName(name: string): Promise<Cluster | undefined> {
    const response = await this.request.get(this.url(CcApiRoutes.KUBECLUSTERS), {
      headers: this.headers,
      params: { where: JSON.stringify({ name }) },
    });
    await assertResponseOk(response, 'GET kubeclusters');
    return ((await response.json()) as ClustersListResponse)._items[0];
  }

  async delete(cluster: Cluster): Promise<void> {
    const response = await this.request.delete(
      this.url(`${CcApiRoutes.KUBECLUSTERS}/${cluster._id}`),
      {
        // Eve REST API rejects DELETE without the resource's current etag.
        headers: { ...this.headers, 'If-Match': cluster._etag },
      },
    );
    await assertResponseOk(response, `DELETE kubeclusters/${cluster._id}`);
  }

  /** Teardown for a created cluster, a no-op once the UI removed it. Exact name only — a prefix sweep would hit parallel workers. */
  async deleteByName(name: string): Promise<boolean> {
    const cluster = await this.findByName(name);
    if (cluster) {
      await this.delete(cluster);
    }
    return Boolean(cluster);
  }
}
