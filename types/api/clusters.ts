export type Cluster = {
  _id: string;
  _etag: string;
  name: string;
};

export type ClustersListResponse = {
  _items: Cluster[];
};
