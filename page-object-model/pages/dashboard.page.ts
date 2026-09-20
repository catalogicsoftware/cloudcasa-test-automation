import { expect, Page, test } from '@playwright/test';
import { BasePage } from './base.page';
import { Container } from 'page-factory/container';
import { Link } from '@page-factory/link';
import { UserMenu } from '@page-object-model/components/user-menu.components';
import { UserHelpModal } from '@page-object-model/components/user-help-modal.components';
import { TopNav } from '@page-object-model/components/top-nav.components';
import { CcApiRoutes } from 'data/api-routes';

export class DashboardPage extends BasePage {
  readonly dashboardContainer = new Container({
    page: this.page,
    locator: 'app-dashboard',
    name: ' Dashboard',
  });

  // Distinct from TopNav.clustersLink: this one lives inside the dashboard
  // content itself, so clicking it proves the content is interactive (not
  // just the surrounding chrome) once the help modal overlay is gone.
  readonly clustersContentLink = new Link({
    page: this.page,
    locator: 'app-dashboard a.text-black:has-text("Clusters")',
    name: 'Clusters',
  });

  readonly userMenu = new UserMenu(this.page);
  readonly userHelpModal = new UserHelpModal(this.page);
  readonly topNavigationBar = new TopNav(this.page);

  constructor(page: Page) {
    super(page);
  }

  async waitForDashboardData(): Promise<void> {
    await this.waitForResponse(CcApiRoutes.DASHBOARD);
  }

  async shouldOpen(): Promise<void> {
    await test.step('Dashboard page should be opened', async () => {
      await expect(this.page).toHaveURL(/dashboard/);
      await this.dashboardContainer.shouldBeVisible();
    });
  }
}
