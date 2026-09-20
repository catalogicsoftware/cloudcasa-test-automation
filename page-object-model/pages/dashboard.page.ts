import { expect, Page, test } from '@playwright/test';
import { BasePage } from './base.page';
import { Container } from 'page-factory/container';
import { Link } from '@page-factory/link';
import { Table } from '@page-factory/table';
import { UserMenu } from '@page-object-model/components/user-menu.components';
import { UserHelpModal } from '@page-object-model/components/user-help-modal.components';
import { TopNav } from '@page-object-model/components/top-nav.components';
import { JobsTimeRangeSelector } from '@page-object-model/components/jobs-time-range-selector.components';
import { CcApiRoutes } from 'data/api-routes';

export class DashboardPage extends BasePage {
  readonly dashboardContainer = new Container({
    page: this.page,
    locator: 'app-dashboard',
    name: ' Dashboard',
  });

  readonly userMenu = new UserMenu(this.page);
  readonly userHelpModal = new UserHelpModal(this.page);
  readonly topNavigationBar = new TopNav(this.page);
  readonly jobsTimeRange = new JobsTimeRangeSelector(this.page);

  readonly activityTab = new Link({
    page: this.page,
    locator: 'app-navigation-tabs a:has-text("Activity")',
    name: 'Activity',
  });
  readonly clusterBackupsTab = new Link({
    page: this.page,
    locator: 'app-navigation-tabs a:has-text("Cluster backups")',
    name: 'Cluster backups',
  });
  readonly databaseBackupsTab = new Link({
    page: this.page,
    locator: 'app-navigation-tabs a:has-text("Database backups")',
    name: 'Database backups',
  });

  readonly activityTable = new Table({
    page: this.page,
    locator: 'app-activity table',
    name: 'Activity',
  });
  readonly clusterBackupsTable = new Table({
    page: this.page,
    locator: 'app-backups table',
    name: 'Cluster backups',
  });
  readonly databaseBackupsTable = new Table({
    page: this.page,
    locator: 'app-backups-aws table',
    name: 'Database backups',
  });

  private readonly ACTIVITY_COLUMNS = [
    'Job name',
    'Type',
    'Message',
    'Started',
    'Duration',
    'Status',
  ];

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

  async shouldHaveActivityColumns(): Promise<void> {
    await test.step('Activity table should show all its columns', async () => {
      for (const column of this.ACTIVITY_COLUMNS) {
        await expect(
          this.activityTable.getLocator().locator('thead th', { hasText: column }).first(),
        ).toBeVisible();
      }
    });
  }
}
