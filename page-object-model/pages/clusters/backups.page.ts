import { expect, Page, test } from '@playwright/test';
import { BasePage } from '../base.page';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { Input } from '@page-factory/input';
import { Table } from '@page-factory/table';
import { DefineBackupWizard } from '@page-object-model/components/drawers/define-backup.drawer';

export class BackupsPage extends BasePage {
  readonly backupsContainer = new Container({
    page: this.page,
    locator: 'app-backups',
    name: 'Backups',
  });
  readonly backupNameFilter = new Input({
    page: this.page,
    locator: 'app-backups input[placeholder="Backup name"]',
    name: 'Backup name',
  });
  readonly defineBackup = new Button({
    page: this.page,
    locator: 'app-backups button:has-text("Define backup")',
    name: 'Define backup',
  });
  readonly backupsTable = new Table({
    page: this.page,
    locator: 'app-backups table',
    name: 'Backups',
  });
  readonly defineBackupWizard = new DefineBackupWizard(this.page);

  private readonly BACKUP_COLUMNS = ['Backup name', 'Cluster', 'Policy', 'Last run', 'Last 3 runs'];

  constructor(page: Page) {
    super(page);
  }

  async shouldOpen(): Promise<void> {
    await test.step('Backups page should be opened', async () => {
      await expect(this.page).toHaveURL(/\/clusters\/backups/);
      await this.backupsContainer.shouldBeVisible();
    });
  }

  async shouldHaveColumns(): Promise<void> {
    await test.step('Backups table should show all its columns', async () => {
      for (const column of this.BACKUP_COLUMNS) {
        await expect(
          this.page.locator('app-backups thead th', { hasText: column }).first(),
        ).toBeVisible();
      }
    });
  }

  async openDefineBackupWizard(): Promise<DefineBackupWizard> {
    await this.defineBackup.click();
    await this.defineBackupWizard.shouldBeOpened();
    return this.defineBackupWizard;
  }
}
