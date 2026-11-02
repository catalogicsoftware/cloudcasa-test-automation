import type { DrawerShortcutCase, ShortcutCase } from '../types/data/shortcut';

const OVERVIEW_STAR_DEFECT =
  'Actual: a click on the star does nothing — no toast, the star stays empty, and the console ' +
  'reports "TypeError: Cannot read properties of undefined (reading \'type\')". ' +
  'Expected: the toast "Shortcut added successfully", a filled star and a tile on the dashboard.';

const NO_ADDED_TOAST_DEFECT =
  'Actual: a click on the star fills it and adds the tile, but no toast shows (the removal still ' +
  'shows "Shortcut removed successfully"). Expected: the toast "Shortcut added successfully".';

/** Pages with a heading star; section/name are the tile's lines, which don't always repeat the heading (Backup storage → "Storage"). */
export const PAGE_SHORTCUTS: ShortcutCase[] = [
  {
    route: '/clusters',
    opensAt: '/clusters/overview',
    section: 'Clusters',
    name: 'Overview',
    defect: OVERVIEW_STAR_DEFECT,
  },
  { route: '/clusters/backups', section: 'Clusters', name: 'Backups' },
  { route: '/clusters/restores', section: 'Clusters', name: 'Restores' },
  { route: '/clusters/migrations', section: 'Clusters', name: 'Migration' },
  { route: '/clusters/replications', section: 'Clusters', name: 'Replication' },
  { route: '/clusters/recovery-points', section: 'Clusters', name: 'Recovery points' },
  {
    route: '/dr/clusters',
    section: 'CloudCasa DR',
    name: 'Clusters',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/dr/storage-systems',
    section: 'CloudCasa DR',
    name: 'Storage systems',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/dr/plans',
    section: 'CloudCasa DR',
    name: 'Plans',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/dr/recoveries',
    section: 'CloudCasa DR',
    name: 'Recovery jobs',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/databases/overview',
    section: 'Databases',
    name: 'Overview',
    defect: OVERVIEW_STAR_DEFECT,
  },
  { route: '/databases/backups', section: 'Databases', name: 'Backups' },
  { route: '/databases/restores', section: 'Databases', name: 'Restores' },
  { route: '/databases/recovery-points', section: 'Databases', name: 'Recovery points' },
  { route: '/configuration/policies', section: 'Configuration', name: 'Policies' },
  {
    route: '/configuration/hooks',
    section: 'Configuration',
    name: 'App hooks',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/configuration/mystorage',
    section: 'Configuration',
    name: 'Storage',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  { route: '/configuration/cloud-accounts', section: 'Configuration', name: 'Cloud accounts' },
  {
    route: '/configuration/audit-logs',
    section: 'Configuration',
    name: 'Audit logs',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/configuration/billing',
    section: 'Configuration',
    name: 'Billing & payments',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/configuration/users',
    section: 'Configuration',
    name: 'Users',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  { route: '/configuration/user-groups', section: 'Configuration', name: 'Users groups' },
  { route: '/configuration/roles', section: 'Configuration', name: 'Roles' },
  { route: '/configuration/api-keys', section: 'Configuration', name: 'API Keys' },
];

/** Drawers (and the Add policy dialog) with a header star; `?new=true` opens the drawer and the app drops it once open. */
export const DRAWER_SHORTCUTS: DrawerShortcutCase[] = [
  {
    route: '/clusters?new=true',
    opensAt: '/clusters/overview',
    section: 'Clusters',
    name: 'Add cluster',
    drawerTitle: 'Add Cluster',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/clusters/backups?new=true',
    opensAt: '/clusters/backups',
    section: 'Clusters',
    name: 'Define cluster backup',
    drawerTitle: 'Define cluster backup',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/clusters/restores?new=true',
    opensAt: '/clusters/restores',
    section: 'Clusters',
    name: 'Define cluster restore',
    drawerTitle: 'Define restore cluster',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/clusters/migrations?new=true',
    opensAt: '/clusters/migrations',
    section: 'Clusters',
    name: 'Define cluster migration',
    drawerTitle: 'New Migration',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/clusters/replications?new=true',
    opensAt: '/clusters/replications',
    section: 'Clusters',
    name: 'Define cluster replication',
    drawerTitle: 'New Replication',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/configuration/cloud-accounts?new=true',
    opensAt: '/configuration/cloud-accounts',
    section: 'Configuration',
    name: 'Add cloud account',
    drawerTitle: 'Add Cloud Account',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/configuration/policies?new=true',
    opensAt: '/configuration/policies',
    section: 'Configuration',
    name: 'Add policy',
    drawerTitle: 'Add policy',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/configuration/mystorage/object?new=true',
    opensAt: '/configuration/mystorage/object',
    section: 'Configuration',
    name: 'Add object storage',
    drawerTitle: 'Add object storage',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/configuration/users/invitations?new=true',
    opensAt: '/configuration/users/invitations',
    section: 'Configuration',
    name: 'Invite user',
    drawerTitle: 'Invite user',
    defect: NO_ADDED_TOAST_DEFECT,
  },
  {
    route: '/virtual-machines/backups?new=true',
    opensAt: '/virtual-machines/backups',
    section: 'VMs',
    name: 'Define VM backup',
    drawerTitle: 'Define VM backup',
    defect:
      'Actual: the star of the "Define VM backup" drawer toggles the "Clusters / Define cluster ' +
      'backup" shortcut (/clusters/backups?new=true). Expected: a VMs tile of its own that ' +
      'reopens the "Define VM backup" drawer.',
  },
  {
    route: '/virtual-machines/restores?new=true',
    opensAt: '/virtual-machines/restores',
    section: 'VMs',
    name: 'Restore VM',
    drawerTitle: 'Restore VM',
    defect:
      'Actual: the star of the "Restore VM" drawer toggles the "Clusters / Define cluster ' +
      'restore" shortcut (/clusters/restores?new=true). Expected: a VMs tile of its own that ' +
      'reopens the "Restore VM" drawer.',
  },
];
