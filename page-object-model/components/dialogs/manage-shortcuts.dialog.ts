import { Locator, Page, test } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { Title } from '@page-factory/title';
import { escapeRegExp } from '@utils/generic';

const DIALOG = 'mat-dialog-container app-manage-shortcuts';

/** The "Shortcuts" modal behind the pencil of the dashboard Shortcuts widget. */
export class ManageShortcutsDialog {
  readonly dialog: Container;
  readonly title: Title;
  readonly saveButton: Button;
  readonly cancelButton: Button;

  constructor(protected readonly page: Page) {
    this.dialog = new Container({ page, locator: DIALOG, name: 'Shortcuts' });
    this.title = new Title({ page, locator: `${DIALOG} .modal-title`, name: 'Shortcuts' });
    this.saveButton = new Button({
      page,
      locator: `${DIALOG} .modal-footer button:has-text("Save")`,
      name: 'Save',
    });
    this.cancelButton = new Button({
      page,
      locator: `${DIALOG} .modal-footer button:has-text("Cancel")`,
      name: 'Cancel',
    });
  }

  /** One row per shortcut, labelled "<section> - <name>" — anchored, so "Users" never matches "Users groups". */
  row(section: string, name: string): Locator {
    return this.dialog
      .getLocator()
      .locator('.list-group-item')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(`${section} - ${name}`)}\\s*$`) });
  }

  /** Bins the row and saves; the modal closes once the change is stored. */
  async removeShortcut(section: string, name: string): Promise<void> {
    await test.step(`Remove the shortcut "${section} - ${name}" and save`, async () => {
      await this.row(section, name).locator('button.text-danger').click();
      await this.saveButton.click();
      await this.dialog.getLocator().waitFor({ state: 'detached' });
    });
  }
}
