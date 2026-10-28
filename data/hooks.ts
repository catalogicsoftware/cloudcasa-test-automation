import { faker } from '@faker-js/faker';
import { testResourceName } from '@utils/resource-names';
import type { HookType } from '../types/api/hooks';
import type { HookApp, HookCase, PodSelector } from '../types/data/hook';

export const HOOK_TYPE_LABELS: Record<HookType, string> = {
  PRE_BACKUP: 'Pre-backup',
  POST_BACKUP: 'Post-backup',
  POST_RESTORE: 'Post-restore',
  COMMON: 'Common',
};

export const HOOK_TYPES = Object.keys(HOOK_TYPE_LABELS) as HookType[];

/** The table names an app without a container after the pod's default one. */
export const DEFAULT_CONTAINER_LABEL = 'Default';

/** A label value must be a Kubernetes-valid token, so it stays lowercase letters only. */
const randomToken = (): string => faker.string.alpha({ length: 8, casing: 'lower' });

export const hookApp = ({ withContainer = false } = {}): HookApp => ({
  podSelector: { key: 'app', value: randomToken() },
  container: withContainer ? `c-${randomToken()}` : '',
  command: `echo ${randomToken()}`,
});

export const hookCase = (type: HookType = 'PRE_BACKUP', appCount = 1): HookCase => ({
  name: testResourceName('hook'),
  type,
  apps: Array.from({ length: appCount }, () => hookApp()),
});

/** What the drawer fills in when this template is picked; the name is left for the user. */
export const MYSQL_PRE_BACKUP_TEMPLATE = {
  name: 'mysql-pre-backup-system-hook',
  type: 'PRE_BACKUP' as HookType,
  podSelector: { key: 'app', value: 'mysql' },
  command: /FLUSH TABLES WITH READ LOCK/,
};

/** The key-value input takes the pair as one `key=value` string. */
export const podSelectorInput = ({ key, value }: PodSelector): string => `${key}=${value}`;

/** The table spells the pair `key:value`, the drawer badge `key = value` with loose spacing. */
export const podSelectorInTable = ({ key, value }: PodSelector): string => `${key}:${value}`;

export const podSelectorBadge = ({ key, value }: PodSelector): RegExp =>
  new RegExp(`${key}\\s*=\\s*${value}`);
