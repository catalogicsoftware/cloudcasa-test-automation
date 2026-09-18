import { Page } from '@playwright/test';
import { Link } from '@page-factory/link';

export type ClusterSection =
  'Overview' | 'Backups' | 'Restores' | 'Migration' | 'Replication' | 'Recovery points';

export class ClustersSidebar {
  constructor(protected readonly page: Page) {}

  navItem(name: ClusterSection): Link {
    return new Link({
      page: this.page,
      locator: `app-navigation-menu a:text-is("${name}")`,
      name: name,
    });
  }
}
