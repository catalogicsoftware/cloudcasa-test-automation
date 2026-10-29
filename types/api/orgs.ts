export type Org = {
  _id: string;
  _etag: string;
  name: string; // internal, never shown in the UI
  display_name: string;
};

export type OrgsListResponse = {
  _items: Org[];
  _meta: {
    page: number;
    max_results: number;
    total: number;
  };
};
