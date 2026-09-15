import { expect, Page, test } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { DIALOG_CLOSE_TIMEOUT } from '@data/timeouts';

/**
 * The "Do you want to proceed?" popover the policy row actions confirm through. It is a
 * mat-menu overlay rather than the mat-dialog ConfirmationDialog storage uses, and it names
 * no resource, so the row it belongs to can only be established by which action was clicked.
 */
export class ProceedConfirmation {
  // "conformation" is the application's own spelling of the class.
  private static readonly PANEL = '.mat-menu-panel:has(.conformation-actions)';

  readonly panel: Container;
  readonly yes: Button;
  readonly no: Button;

  constructor(protected readonly page: Page) {
    this.panel = new Container({
      page,
      locator: ProceedConfirmation.PANEL,
      name: 'Proceed confirmation',
    });
    this.yes = new Button({
      page,
      locator: `${ProceedConfirmation.PANEL} .conformation-actions button:text-is("Yes")`,
      name: 'Yes',
    });
    this.no = new Button({
      page,
      locator: `${ProceedConfirmation.PANEL} .conformation-actions button:text-is("No")`,
      name: 'No',
    });
  }

  async confirm(): Promise<void> {
    await test.step('Confirm the action', async () => {
      await this.panel.shouldBeVisible();
      await this.yes.click();
      // The popover stays up until its backend call answers, which outlasts the expect default.
      await expect(this.panel.getLocator()).toHaveCount(0, { timeout: DIALOG_CLOSE_TIMEOUT });
    });
  }
}
