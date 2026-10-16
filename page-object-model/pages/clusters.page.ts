import { expect, Page, test } from '@playwright/test';
import { BasePage } from './base.page';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { Title } from '@page-factory/title';
import { Table } from '@page-factory/table';
import { ClustersSidebar } from '@page-object-model/components/clusters-sidebar.components';
import { DefineClusterBackupWizard } from '@page-object-model/components/wizards/define-cluster-backup.wizard';
import { AddClusterSidebar } from '@page-object-model/components/drawers/add-cluster.drawer';
import { InstallClusterDialog } from '@page-object-model/components/dialogs/install-cluster.dialog';
import { AddClusterDialog } from '@page-object-model/components/dialogs/add-cluster.dialog';
import { InstallAgentDialog } from '@page-object-model/components/dialogs/install-agent.dialog';
import { ProceedConfirmation } from '@page-object-model/components/proceed-confirmation.components';

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
  readonly addClusterButton = new Button({
    page: this.page,
    locator: 'app-clusters button:has-text("Add cluster")',
    name: 'Add cluster',
  });
  readonly addClusterSidebar = new AddClusterSidebar(this.page);
  readonly installClusterDialog = new InstallClusterDialog(this.page);
  readonly addClusterDialog = new AddClusterDialog(this.page);
  readonly installAgentDialog = new InstallAgentDialog(this.page);
  readonly removeConfirmation = new ProceedConfirmation(this.page);

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

  async openAddClusterSidebar(): Promise<AddClusterSidebar> {
    await this.addClusterButton.click();
    await this.addClusterSidebar.shouldBeOpened();
    return this.addClusterSidebar;
  }

  async openAddClusterDialog(): Promise<AddClusterDialog> {
    await this.addClusterButton.click();
    return this.addClusterDialog;
  }
}
