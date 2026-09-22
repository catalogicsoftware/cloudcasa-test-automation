export type DashboardStats = {
  kubernetes: {
    num_clusters: number;
    num_active_clusters: number;
  };
  cloudaccounts: {
    num_accounts: number;
  };
  awsrds: {
    num_protected_databases: number;
  };
};
