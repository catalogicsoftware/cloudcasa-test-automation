import test, { expect, Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { Button } from '@page-fatory/button';
import { Container } from '@page-fatory/container';
import { Link } from '@page-fatory/link';
import { Table } from '@page-fatory/table';
import { AddObjectStorageWizard } from '@page-object-model/components/drawers/add-object-storage.drawer';

const OBJECT_STORAGE_COLUMNS = [
  'Name',
  'Provider',
  'Bucket name',
  'Region',
  'Endpoint',
  'Status',
  'Cluster',
];

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
      for (const column of OBJECT_STORAGE_COLUMNS) {
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
}
