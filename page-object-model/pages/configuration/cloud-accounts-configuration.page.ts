import { expect, Page, test } from '@playwright/test';
import { BasePage } from '../base.page';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { Table } from '@page-factory/table';
import { AddCloudAccountDrawer } from '@page-object-model/components/drawers/add-cloud-account.drawer';
import { cloudProviderCase } from '@data/cloud-accounts';
import type { CloudProviderType } from '../../../types/data/cloud-accounts';

export class CloudAccountsConfigurationPage extends BasePage {
  readonly cloudAccountsContainer = new Container({
    page: this.page,
    locator: 'app-cloud-accounts',
    name: 'Cloud accounts',
  });
  readonly addCloudAccount = new Button({
    page: this.page,
    locator: 'app-cloud-accounts button:has-text("Add cloud account")',
    name: 'Add cloud account',
  });
  readonly accountsTable = new Table({
    page: this.page,
    locator: 'app-cloud-accounts table',
    name: 'Cloud accounts',
  });
  readonly providerFilterTrigger = new Button({
    page: this.page,
    locator: 'app-cloud-accounts app-input-select-checkboxes button.mat-menu-trigger',
    name: 'Provider filter',
  });
  readonly addCloudAccountDrawer = new AddCloudAccountDrawer(this.page);

  constructor(page: Page) {
    super(page);
  }

  async shouldOpen(): Promise<void> {
    await test.step('Cloud accounts page should be opened', async () => {
      await expect(this.page).toHaveURL(/\/configuration\/cloud-accounts/);
      await this.cloudAccountsContainer.shouldBeVisible();
    });
  }

  /** The provider_type query param is what the dashboard's cloud provider links carry. */
  async shouldFilterByProvider(type: CloudProviderType): Promise<void> {
    const provider = cloudProviderCase(type);

    await test.step(`Provider filter should hold the value "${provider.label}"`, async () => {
      await this.providerFilterTrigger.shouldHaveText(`Provider: ${provider.label}`);
    });
  }

  /** The menu has no footer "close" button (unlike Dropdown) — unchecking the selected value closes it. */
  async clearProviderFilter(): Promise<void> {
    await test.step('Clear the provider filter', async () => {
      await this.providerFilterTrigger.click();
      await this.page.locator('.cdk-overlay-container input[type="checkbox"]:checked').uncheck();
      await this.providerFilterTrigger.shouldHaveText('Provider: All');
    });
  }

  async openAddCloudAccountDialog(): Promise<AddCloudAccountDrawer> {
    await this.addCloudAccount.click();
    await this.addCloudAccountDrawer.shouldBeOpened();
    return this.addCloudAccountDrawer;
  }
}
