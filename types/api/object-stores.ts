export type ObjectStore = {
  _id: string;
  _etag: string;
  name: string;
};

export type ObjectStoresListResponse = {
  _items: ObjectStore[];
};
