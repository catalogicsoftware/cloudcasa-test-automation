export type Role = {
  _id: string;
  name: string;
  type: string; // 'BUILTIN' | custom types
  _etag: string;
};

export type RolesListResponse = {
  _items: Role[];
  _meta: {
    page: number;
    max_results: number;
    total: number;
  };
};
