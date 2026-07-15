import { Page } from '@playwright/test';
import { CcApiRoutes } from 'data/api-routes';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(url: string = '/') {
    await this.page.goto(url, { waitUntil: 'load' });
  }

  async waitForLoad() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForResponse(urlPart: string) {
    await this.page.waitForResponse(response => response.url().includes(urlPart));
  }

  async reloadPage() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }
}
