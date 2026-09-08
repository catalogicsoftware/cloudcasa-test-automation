import { expect, Page, test } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { DIALOG_CLOSE_TIMEOUT } from '@data/timeouts';

/**
 * Angular Material confirm dialog used by destructive row actions. It renders in
 * the CDK overlay, outside the page's own markup, so it is located globally
 * rather than scoped to the table it was opened from.
 */
export class ConfirmationDialog {
  readonly dialog: Container;
  readonly confirm: Button;
  readonly cancel: Button;

  constructor(
    protected readonly page: Page,
    confirmText: string,
    name = 'Confirmation',
  ) {
    this.dialog = new Container({ page, locator: 'mat-dialog-container', name });
    this.confirm = new Button({
      page,
      locator: `mat-dialog-container .modal-footer button:has-text("${confirmText}")`,
      name: confirmText,
    });
    this.cancel = new Button({
      page,
      locator: 'mat-dialog-container .modal-footer button:has-text("Cancel")',
      name: 'Cancel',
    });
  }

  /** The title names the resource, which is what proves the dialog belongs to the row that was clicked. */
  async shouldAskAbout(resourceName: string): Promise<void> {
    await test.step(`Confirmation dialog should name "${resourceName}"`, async () => {
      await expect(this.dialog.getLocator()).toContainText(resourceName);
    });
  }

  async confirmAction(): Promise<void> {
    await this.confirm.click();
    // The dialog stays up until its backend call answers, which outlasts the expect default.
    await expect(this.dialog.getLocator()).toHaveCount(0, { timeout: DIALOG_CLOSE_TIMEOUT });
  }
}
