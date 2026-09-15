import test, { expect, Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { Link } from '@page-factory/link';
import { Table } from '@page-factory/table';
import { AddObjectStorageWizard } from '@page-object-model/components/drawers/add-object-storage.drawer';
import { ConfirmationDialog } from '@page-object-model/components/confirmation-dialog.components';
import { STORAGE_LIST_RELOAD_TIMEOUT } from '@data/timeouts';
import { listedAs } from '@data/storage';
import type { StorageTargetSpec } from '../../../types/data/storage';

export class StorageConfigurationPage extends BasePage {
  readonly storagesContainer = new Container({
    page: this.page,
    locator: 'app-storages',
    name: 'Backup storage',
  });
  readonly objectStorageTab = new Link({
    page: this.page,
    locator: 'app-navigation-tabs a:has-text("Object storage")',
    name: 'Object storage',
  });
  readonly fileStorageTab = new Link({
    page: this.page,
    locator: 'app-navigation-tabs a:has-text("File storage")',
    name: 'File storage',
  });
  readonly addStorage = new Button({
    page: this.page,
    locator: 'app-storages button:has-text("Add storage")',
    name: 'Add storage',
  });
  readonly objectStoragesTable = new Table({
    page: this.page,
    locator: 'app-object-storages table',
    name: 'Object storages',
  });
  readonly addObjectStorageWizard = new AddObjectStorageWizard(this.page);
  readonly removeStorageDialog = new ConfirmationDialog(this.page, 'Remove', 'Remove storage');

  private readonly OBJECT_STORAGE_COLUMNS = [
    'Name',
    'Provider',
    'Bucket name',
    'Region',
    'Endpoint',
    'Status',
    'Cluster',
  ];
  constructor(page: Page) {
    super(page);
  }

  async shouldOpen(): Promise<void> {
    await test.step('Backup storage page should be opened', async () => {
      await expect(this.page).toHaveURL(/\/configuration\/mystorage/);
      await this.storagesContainer.shouldBeVisible();
    });
  }

  async shouldHaveObjectStorageColumns(): Promise<void> {
    await test.step('Object storage table should show all its columns', async () => {
      for (const column of this.OBJECT_STORAGE_COLUMNS) {
        await expect(
          this.page.locator('app-object-storages thead th', { hasText: column }).first(),
        ).toBeVisible();
      }
    });
  }

  async openAddObjectStorageWizard(): Promise<AddObjectStorageWizard> {
    await this.addStorage.click();
    await this.addObjectStorageWizard.shouldBeOpened();
    return this.addObjectStorageWizard;
  }

  /** Every provider detail typed into the wizard must come back out of the storage list. */
  async shouldListObjectStorage(name: string, target: StorageTargetSpec): Promise<void> {
    // The backend reports its own provider_type, which is not always the radio the wizard was filled through.
    const listed = listedAs(target);

    // Azure names a storage account instead of a bucket and has no endpoint, so it owns fewer cells.
    await this.shouldListStorage(
      name,
      target.provider === 'azure'
        ? { Provider: listed.provider, Region: listed.region }
        : {
            Provider: listed.provider,
            'Bucket name': target.bucket,
            Endpoint: target.endpoint,
            Region: listed.region,
          },
    );
  }

  private async shouldListStorage(
    name: string,
    cells: Record<string, string | undefined>,
  ): Promise<void> {
    await test.step(`Object storage "${name}" should be listed with its provider details`, async () => {
      await this.objectStoragesTable.shouldHaveRow(name, STORAGE_LIST_RELOAD_TIMEOUT);
      for (const [column, expected] of Object.entries(cells)) {
        if (expected) {
          await this.objectStoragesTable.shouldHaveCellValue(name, column, expected);
        }
      }
    });
  }

  async removeObjectStorage(name: string): Promise<void> {
    await test.step(`Remove object storage "${name}"`, async () => {
      await this.objectStoragesTable.clickRowAction(name, 'Remove');
      await this.removeStorageDialog.shouldAskAbout(name);
      await this.removeStorageDialog.confirmAction();
    });
  }
}
