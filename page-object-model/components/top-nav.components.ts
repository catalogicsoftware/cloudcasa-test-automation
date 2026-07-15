import { Page } from '@playwright/test';
import { Link } from '@page-fatory/link';

export class TopNav {
  readonly dashboardLink: Link;
  readonly clustersLink: Link;
  readonly databasesLink: Link;
  readonly drLink: Link;
  readonly reportsLink: Link;
  readonly configurationLink: Link;

  constructor(protected readonly page: Page) {
    this.dashboardLink = new Link({
      page,
      locator: 'ul.navbar-nav a:has-text("Dashboard")',
      name: 'Dashboard',
    });
    this.clustersLink = new Link({
      page,
      locator: 'ul.navbar-nav a:has-text("Clusters")',
      name: 'Clusters',
    });
    this.databasesLink = new Link({
      page,
      locator: 'ul.navbar-nav a:has-text("Databases")',
      name: 'Databases',
    });
    this.drLink = new Link({ page, locator: 'ul.navbar-nav a:has-text("DR")', name: 'DR' });
    this.reportsLink = new Link({
      page,
      locator: 'ul.navbar-nav a:has-text("Reports")',
      name: 'Reports',
    });
    this.configurationLink = new Link({
      page,
      locator: 'ul.navbar-nav a:has-text("Configuration")',
      name: 'Configuration',
    });
  }

  async goToDashboard(): Promise<void> {
    await this.dashboardLink.click();
  }

  async goToClusters(): Promise<void> {
    await this.clustersLink.click();
  }

  async goToDatabases(): Promise<void> {
    await this.databasesLink.click();
  }

  async goToDR(): Promise<void> {
    await this.drLink.click();
  }

  async goToReports(): Promise<void> {
    await this.reportsLink.click();
  }

  async goToConfiguration(): Promise<void> {
    await this.configurationLink.click();
  }
}
