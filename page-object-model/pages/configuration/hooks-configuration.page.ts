import { Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { Container } from '@page-factory/container';
import { Link } from '@page-factory/link';
import { Table } from '@page-factory/table';
import { Title } from '@page-factory/title';
import { AddHookDrawer } from '@page-object-model/components/drawers/add-hook.drawer';

export class HooksConfigurationPage extends BasePage {
  readonly hooksContainer = new Container({
    page: this.page,
    locator: 'app-hooks',
    name: 'App hooks',
  });
  readonly heading = new Title({ page: this.page, locator: 'app-hooks h4', name: 'App hooks' });
  readonly addHook = new Link({
    page: this.page,
    locator: 'app-hooks a:has-text("Add app hook")',
    name: 'Add app hook',
  });
  readonly hooksTable = new Table({
    page: this.page,
    locator: 'app-hooks table',
    name: 'App hooks',
  });
  readonly emptyState = new Container({
    page: this.page,
    locator: 'app-hooks .table__no-info',
    name: 'App hooks empty state',
  });
  readonly addHookDrawer = new AddHookDrawer(this.page);

  constructor(page: Page) {
    super(page);
  }

  async openAddHookDrawer(): Promise<AddHookDrawer> {
    await this.addHook.click();
    await this.addHookDrawer.shouldBeOpened();
    return this.addHookDrawer;
  }
}
