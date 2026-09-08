export type Policy = {
  _id: string;
  _etag: string;
  name: string;
  timezone: string;
};

export type PoliciesListResponse = {
  _items: Policy[];
};
