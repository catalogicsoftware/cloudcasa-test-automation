import type { HookType } from '../api/hooks';

export type PodSelector = {
  key: string;
  value: string;
};

/** One "app" block of the drawer: the pods it targets and what runs in them. */
export type HookApp = {
  podSelector: PodSelector;
  /** Empty means the pod's default container — the table then shows "Default". */
  container: string;
  command: string;
};

export type HookCase = {
  name: string;
  type: HookType;
  apps: HookApp[];
};
