import { Locator, Page } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';

const DIALOG = 'mat-dialog-container:has(app-switch-org)';

export class SwitchOrganizationDialog {
  readonly dialog: Container;
  readonly cancelButton: Button;

  constructor(protected readonly page: Page) {
    this.dialog = new Container({ page, locator: DIALOG, name: 'Switch organization' });
    this.cancelButton = new Button({
      page,
      locator: `${DIALOG} button:has-text("Cancel")`,
      name: 'Cancel',
    });
  }

  /** Each organization is a radio option labelled with its name; the label carries the accessible name. */
  organizationOption(organizationName: string): Locator {
    return this.dialog.getLocator().getByLabel(organizationName, { exact: true });
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
