import { expect, Page, test } from '@playwright/test';
import { BasePage } from './base.page';
import { Container } from '@page-factory/container';

export class ReportsPage extends BasePage {
  readonly reportsContainer = new Container({
    page: this.page,
    locator: 'app-reports',
    name: 'Reports',
  });

  constructor(page: Page) {
    super(page);
  }

  async shouldOpen(): Promise<void> {
    await test.step('Reports page should be opened', async () => {
      await expect(this.page).toHaveURL(/\/reports/);
      await this.reportsContainer.shouldBeVisible();
    });
  }
}
