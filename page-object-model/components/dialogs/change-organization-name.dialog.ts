import { Page } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { Input } from '@page-factory/input';

const DIALOG = 'mat-dialog-container:has(app-change-organization-name-dialog)';

export class ChangeOrganizationNameDialog {
  readonly dialog: Container;
  /** Formly numbers the field id per form instance, so it is matched on its stable middle. */
  readonly organizationName: Input;
  readonly changeButton: Button;
  readonly cancelButton: Button;

  constructor(protected readonly page: Page) {
    this.dialog = new Container({ page, locator: DIALOG, name: 'Change organization name' });
    this.organizationName = new Input({
      page,
      locator: `${DIALOG} input[id*="input_display_name"]`,
      name: 'Organization name',
    });
    this.changeButton = new Button({
      page,
      locator: `${DIALOG} button:text-is("Change")`,
      name: 'Change',
    });
    this.cancelButton = new Button({
      page,
      locator: `${DIALOG} button:text-is("Cancel")`,
      name: 'Cancel',
    });
  }

  async change(organizationName: string): Promise<void> {
    await this.organizationName.fill(organizationName);
    await this.changeButton.click();
  }
}
