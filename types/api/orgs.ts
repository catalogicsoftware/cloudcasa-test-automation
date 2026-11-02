export type Org = {
  _id: string;
  _etag: string;
  name: string; // internal, never shown in the UI
  display_name: string;
  enable_yaml_catalog_for_browse: boolean;
  uiprefs: Record<string, string>;
  backup_provider?: { user_objectstore?: string };
};

export type OrgsListResponse = {
  _items: Org[];
  _meta: {
    page: number;
    max_results: number;
    total: number;
  };
};
