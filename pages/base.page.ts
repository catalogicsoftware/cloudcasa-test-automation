import { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(url: string = '/') {
    await this.page.goto(url, { waitUntil: 'load' });
  }

  async waitForLoad() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async reloadPage() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }
}
