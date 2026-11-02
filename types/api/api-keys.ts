export type ApiKey = {
  _id: string;
  _etag: string;
  name: string;
};

export type ApiKeysListResponse = {
  _items: ApiKey[];
};
