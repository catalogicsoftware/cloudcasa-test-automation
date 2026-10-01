export type KubeCluster = {
  _id: string;
  _etag: string;
  name: string;
};

export type KubeClustersListResponse = {
  _items: KubeCluster[];
};
