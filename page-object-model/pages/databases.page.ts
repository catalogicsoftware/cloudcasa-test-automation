import { expect, Page, test } from '@playwright/test';
import { BasePage } from './base.page';
import { Container } from '@page-factory/container';

export class DatabasesPage extends BasePage {
  readonly databasesContainer = new Container({
    page: this.page,
    locator: 'app-databases',
    name: 'Databases',
  });

  constructor(page: Page) {
    super(page);
  }

  async shouldOpen(): Promise<void> {
    await test.step('Databases page should be opened', async () => {
      await expect(this.page).toHaveURL(/\/databases/);
      await this.databasesContainer.shouldBeVisible();
    });
  }
}
