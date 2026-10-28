export type HookType = 'PRE_BACKUP' | 'POST_BACKUP' | 'POST_RESTORE' | 'COMMON';

export type HookTarget = {
  command: string;
  container?: string;
};

export type HookEntry = {
  target: HookTarget[];
  labels: Record<string, string>;
};

export type CreateHookRequest = {
  name: string;
  hook_type: HookType;
  hook: HookEntry[];
};

export type Hook = CreateHookRequest & {
  _id: string;
  _etag: string;
};

export type HooksListResponse = {
  _items: Hook[];
};
