import { Page, test } from '@playwright/test';
import { Button } from '@page-factory/button';

export class JobsTimeRangeSelector {
  readonly trigger: Button;

  constructor(protected readonly page: Page) {
    this.trigger = new Button({
      page,
      locator: 'app-status button.mat-menu-trigger',
      name: 'Jobs time range',
    });
  }

  async open(): Promise<void> {
    await this.trigger.click();
  }

  async selectRange(label: string): Promise<void> {
    await test.step(`Select time range "${label}"`, async () => {
      await this.page.locator('.mat-menu-panel button.mat-menu-item', { hasText: label }).click();
    });
  }
}
