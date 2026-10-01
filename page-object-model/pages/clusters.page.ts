import { expect, Page, test } from '@playwright/test';
import { BasePage } from './base.page';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { Title } from '@page-factory/title';
import { Table } from '@page-factory/table';
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
  readonly addClusterButton = new Button({
    page: this.page,
    locator: 'app-clusters button:has-text("Add cluster")',
    name: 'Add cluster',
  });
  readonly addClusterDialog = new AddClusterDialog(this.page);
  readonly installAgentDialog = new InstallAgentDialog(this.page);
  readonly removeConfirmation = new ProceedConfirmation(this.page);

  constructor(page: Page) {
    super(page);
  }

  async shouldOpen(): Promise<void> {
    await test.step('Clusters page should be opened', async () => {
      await expect(this.page).toHaveURL(/\/clusters/);
      await this.clustersContainer.shouldBeVisible();
    });
  }

  async openAddClusterDialog(): Promise<AddClusterDialog> {
    await this.addClusterButton.click();
    return this.addClusterDialog;
  }
}
