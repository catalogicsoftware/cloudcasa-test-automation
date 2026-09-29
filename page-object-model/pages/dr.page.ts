import { expect, Page, test } from '@playwright/test';
import { BasePage } from './base.page';
import { Container } from '@page-factory/container';
import { Title } from '@page-factory/title';

export class DrPage extends BasePage {
  readonly drContainer = new Container({
    page: this.page,
    locator: 'app-dr',
    name: 'DR',
  });
  readonly heading = new Title({
    page: this.page,
    locator: 'app-dr h4',
    name: 'DR Heading',
  });

  constructor(page: Page) {
    super(page);
  }

  async shouldOpen(): Promise<void> {
    await test.step('DR page should be opened', async () => {
      await expect(this.page).toHaveURL(/\/dr/);
      await this.drContainer.shouldBeVisible();
    });
  }
}
