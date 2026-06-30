import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

export class DashboardPage extends BasePage {
  readonly dashboardContainer = this.page.locator('app-dashboard');

  constructor(page: Page) {
    super(page);
  }
}
