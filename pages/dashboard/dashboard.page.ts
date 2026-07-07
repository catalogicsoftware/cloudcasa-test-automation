import { Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { Container } from 'page-factory/container';

export class DashboardPage extends BasePage {
  readonly dashboardContainer = new Container({
    page: this.page,
    locator: 'app-dashboard',
    name: ' Dashboard',
  });

  constructor(page: Page) {
    super(page);
  }
}
