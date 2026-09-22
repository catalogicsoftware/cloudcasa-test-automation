export type CcUser = {
  _id: string;
  _etag: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  send_alert_emails?: boolean;
  paid?: boolean;
  cc_user_email?: string;
  uiprefs?: Record<string, unknown>;
};

export type UsersListResponse = {
  _items: CcUser[];
  _meta: {
    page: number;
    max_results: number;
    total: number;
  };
};
