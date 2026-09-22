import { Page } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { Title } from '@page-factory/title';

const WIZARD = 'app-backup-cluster';

export class DefineClusterBackupWizard {
  readonly wizard: Container;
  readonly title: Title;
  readonly cancelButton: Button;

  constructor(protected readonly page: Page) {
    this.wizard = new Container({ page, locator: WIZARD, name: 'Define cluster backup' });
    this.title = new Title({
      page,
      locator: `${WIZARD} .sidebar-header h3`,
      name: 'Define cluster backup',
    });
    this.cancelButton = new Button({
      page,
      locator: `${WIZARD} .sidebar-footer button:has-text("Cancel")`,
      name: 'Cancel',
    });
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
