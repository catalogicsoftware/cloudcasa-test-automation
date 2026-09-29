import { expect, Locator, Page, test } from '@playwright/test';
import { BasePage } from './base.page';
import { Container } from 'page-factory/container';
import { Link } from '@page-factory/link';
import { Table } from '@page-factory/table';
import { UserMenu } from '@page-object-model/components/user-menu.components';
import { UserHelpModal } from '@page-object-model/components/user-help-modal.components';
import { TopNav } from '@page-object-model/components/top-nav.components';
import { SwitchOrganizationDialog } from '@page-object-model/components/dialogs/switch-organization.dialog';
import { JobsTimeRangeSelector } from '@page-object-model/components/jobs-time-range-selector.components';
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
  readonly switchOrganizationDialog = new SwitchOrganizationDialog(this.page);
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

  readonly jobStatusCard = new Container({
    page: this.page,
    locator: 'app-status',
    name: 'Job status',
  });
  readonly clustersCard = new Container({
    page: this.page,
    locator: 'app-account-overview .card:has(a[routerlink="/clusters"])',
    name: 'Clusters card',
  });
  readonly clustersCardLink = new Link({
    page: this.page,
    locator: 'app-account-overview a[routerlink="/clusters"]',
    name: 'Clusters',
  });
  readonly cloudProvidersCard = new Container({
    page: this.page,
    locator: 'app-account-overview .card:has-text("Cloud providers")',
    name: 'Cloud providers card',
  });
  readonly shortcutsPanel = new Container({
    page: this.page,
    locator: 'app-shortcuts',
    name: 'Shortcuts',
  });
  readonly clustersOverviewShortcut = new Link({
    page: this.page,
    locator: 'app-shortcuts a[href="/clusters"]',
    name: 'Clusters Overview',
  });
  readonly addClusterShortcut = new Link({
    page: this.page,
    locator: 'app-shortcuts a[href="/clusters?new=true"]',
    name: 'Add cluster',
  });
  readonly cloudAccountsShortcut = new Link({
    page: this.page,
    locator: 'app-shortcuts a[href="/configuration/cloud-accounts"]',
    name: 'Cloud accounts',
  });
  readonly defineClusterBackupShortcut = new Link({
    page: this.page,
    locator: 'app-shortcuts a[href="/clusters/backups?new=true"]',
    name: 'Define cluster backup',
  });
  readonly alertsPanel = new Container({ page: this.page, locator: 'app-alerts', name: 'Alerts' });

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
    await test.step('Activity table should have the expected columns', async () => {
      const namedHeaderCells = this.activityTable
        .getLocator()
        .locator('thead th.table__header-cell')
        .filter({ hasText: /\S/ });

      await expect(namedHeaderCells).toHaveText(this.ACTIVITY_COLUMNS);
    });
  }

  /** Job status filter button, e.g. "Running", "Successful", "Partial", "Skipped", "Failed". */
  jobStatusCounter(label: string): Locator {
    return this.jobStatusCard.getLocator().locator('button.btn', { hasText: label });
  }

  /**
   * The exact stat block (heading + value) for a heading, matched with :text-is() rather than
   * a substring: "Protected DBs" is a substring of the sibling heading "Size of protected DBs",
   * and a substring match resolves both, breaking strict mode.
   */
  private statBlock(scope: Locator, heading: string): Locator {
    return scope
      .locator('.icon-stats')
      .filter({ has: this.page.locator('h6', { hasText: new RegExp(`^${heading}$`) }) });
  }

  /** Stat heading inside the clusters card, e.g. "Configured", "Healthy", "Protected". */
  clustersCardHeading(label: string): Locator {
    return this.statBlock(this.clustersCard.getLocator(), label).locator('h6');
  }

  /** Value shown next to a clusters card heading, e.g. the count under "Configured". */
  clustersCardValue(label: string): Locator {
    return this.statBlock(this.clustersCard.getLocator(), label).locator('.icon-value');
  }

  /** Cloud provider link in the cloud providers card, e.g. "Google", "Azure", "Amazon". */
  cloudProviderLink(name: string): Locator {
    return this.cloudProvidersCard.getLocator().locator(`a:has(input[alt="${name}"])`);
  }

  /** Databases counter in the cloud providers card, e.g. "Accounts", "Protected DBs". */
  databasesCounter(label: string): Locator {
    return this.statBlock(this.cloudProvidersCard.getLocator(), label).locator('.icon-value');
  }
}
