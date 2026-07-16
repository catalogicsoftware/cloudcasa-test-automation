export type CcUser = {
  _id: string;
  _etag: string;
  email: string;
  name?: string;
};

export type UsersListResponse = {
  _items: CcUser[];
  _meta: {
    page: number;
    max_results: number;
    total: number;
  };
};
