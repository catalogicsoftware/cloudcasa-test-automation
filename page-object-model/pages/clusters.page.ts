import { expect, Page, test } from '@playwright/test';
import { BasePage } from './base.page';
import { Container } from '@page-factory/container';
import { Title } from '@page-factory/title';
import { Table } from '@page-factory/table';
import { ClustersSidebar } from '@page-object-model/components/clusters-sidebar.components';
import { DefineClusterBackupWizard } from '@page-object-model/components/wizards/define-cluster-backup.wizard';

export class ClustersPage extends BasePage {
  readonly clustersContainer = new Container({
    page: this.page,
    locator: 'app-clusters',
    name: 'Clusters',
  });

  readonly heading = new Title({
    page: this.page,
    locator: 'app-clusters h4',
    name: 'Clusters Heading',
  });
  readonly clustersTable = new Table({
    page: this.page,
    locator: 'app-clusters table',
    name: 'Clusters',
  });
  readonly clustersSideBar = new ClustersSidebar(this.page);
  readonly defineClusterBackupWizard = new DefineClusterBackupWizard(this.page);

  private readonly CLUSTER_COLUMNS = [
    'Name',
    'Kubernetes version',
    'Agent version',
    'Nodes',
    'State',
    'Last updated',
  ];

  constructor(page: Page) {
    super(page);
  }

  async shouldOpen(): Promise<void> {
    await test.step('Clusters page should be opened', async () => {
      await expect(this.page).toHaveURL(/\/clusters/);
      await this.clustersContainer.shouldBeVisible();
    });
  }

  async shouldHaveColumns(): Promise<void> {
    await test.step('Clusters table should show all its columns', async () => {
      for (const column of this.CLUSTER_COLUMNS) {
        await expect(
          this.page.locator('app-clusters thead th', { hasText: column }).first(),
        ).toBeVisible();
      }
    });
  }
}
