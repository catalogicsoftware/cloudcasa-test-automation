import { Locator, Page, test } from '@playwright/test';
import { Button } from '@page-factory/button';
import { AddPolicyDialog, DIALOG } from './add-policy.dialog';

const SCHEDULES_HEADING = `${DIALOG} h5:text-is("Schedules *")`;

/**
 * Same `app-policy` dialog as `AddPolicyDialog`, in edit mode: the composer above is only for
 * building a new schedule, and the policy's current schedule(s) are listed below it with a
 * "Remove" button each — there is no inline edit, so changing a schedule's time means removing
 * the old entry and adding the new one through the inherited composer.
 */
export class EditPolicyDialog extends AddPolicyDialog {
  readonly savePolicy: Button;

  constructor(page: Page) {
    super(page, 'Edit policy');
    this.savePolicy = new Button({
      page,
      locator: `${DIALOG} button:has-text("Save policy")`,
      name: 'Save policy',
    });
  }

  /** Text (rule + retention) of the schedule already on the policy, read for comparison — not asserted here. */
  async currentScheduleText(): Promise<string> {
    return test.step('Read the current schedule shown in the dialog', async () =>
      (await this.page.locator(`${SCHEDULES_HEADING} ~ div`).first().innerText()).trim());
  }

  /** The existing schedule item whose rule text matches, for the caller to act on or assert against. */
  scheduleItem(rule: string): Locator {
    return this.page.locator(`${SCHEDULES_HEADING} ~ div`, { hasText: rule });
  }

  async removeSchedule(rule: string): Promise<void> {
    await test.step(`Remove the existing schedule "${rule}"`, async () => {
      await this.scheduleItem(rule).locator('button:has-text("Remove")').click();
    });
  }

  async save(): Promise<void> {
    await test.step('Save the policy', async () => {
      await this.savePolicy.click();
    });
  }
}
