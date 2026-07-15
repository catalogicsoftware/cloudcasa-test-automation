import { expect, Page, test } from '@playwright/test';
import { Link } from '@page-fatory/link';

export type ConfigSection =
  | 'Policies'
  | 'App hooks'
  | 'Storage'
  | 'Settings'
  | 'Cloud accounts'
  | 'Audit logs'
  | 'Billing & payments'
  | 'Service plans'
  | 'Users'
  | 'User groups'
  | 'Roles'
  | 'API keys';

export class ConfigurationSidebar {
  constructor(protected readonly page: Page) {}

  navItem(name: ConfigSection): Link {
    return new Link({
      page: this.page,
      locator: `app-navigation-menu a:text-is("${name}")`,
      name: name,
    });
  }

  async goTo(section: ConfigSection): Promise<void> {
    await this.navItem(section).click();
  }
}
