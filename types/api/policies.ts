export type Policy = {
  _id: string;
  _etag: string;
  name: string;
  timezone: string;
};

export type PoliciesListResponse = {
  _items: Policy[];
};

export type PolicySchedule = {
  retainDays: number;
  locked: boolean;
  schedule: { cronSpec: string };
};

export type CreatePolicyRequest = {
  name: string;
  schedules: PolicySchedule[];
};
