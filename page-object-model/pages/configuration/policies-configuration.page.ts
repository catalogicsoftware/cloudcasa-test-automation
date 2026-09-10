import test, { expect, Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { Table } from '@page-factory/table';
import { AddPolicyDialog } from '@page-object-model/components/dialogs/add-policy.dialog';
import { ProceedConfirmation } from '@page-object-model/components/proceed-confirmation.components';
import { expectedFrequency, expectedRetention, expectedRule } from '@data/policies';
import { POLICY_LIST_RELOAD_TIMEOUT } from '@data/timeouts';
import type { ScheduleCase } from '../../../types/data/policy';

export class PoliciesConfigurationPage extends BasePage {
  readonly policiesContainer = new Container({
    page: this.page,
    locator: 'app-policies',
    name: 'Policies',
  });
  readonly addPolicy = new Button({
    page: this.page,
    locator: 'app-policies button:has-text("Add policy")',
    name: 'Add policy',
  });
  readonly policiesTable = new Table({
    page: this.page,
    locator: 'app-policies table',
    name: 'Policies',
  });
  readonly addPolicyDialog = new AddPolicyDialog(this.page);
  readonly removeConfirmation = new ProceedConfirmation(this.page);

  constructor(page: Page) {
    super(page);
  }

  async shouldOpen(): Promise<void> {
    await test.step('Policies page should be opened', async () => {
      await expect(this.page).toHaveURL(/\/configuration\/policies/);
      await this.policiesContainer.shouldBeVisible();
    });
  }

  async openAddPolicyDialog(): Promise<AddPolicyDialog> {
    await this.addPolicy.click();
    await this.addPolicyDialog.shouldBeOpened();
    return this.addPolicyDialog;
  }

  /** Every schedule value typed into the dialog must come back out of the Schedules cell. */
  async shouldListPolicy(name: string, schedule: ScheduleCase, timezone: string): Promise<void> {
    await test.step(`Policy "${name}" should be listed with its ${schedule.label} schedule`, async () => {
      await this.policiesTable.shouldHaveRow(name, POLICY_LIST_RELOAD_TIMEOUT);
      // The cell is a nested table; the frequency is styled uppercase, so it is matched case-insensitively.
      await this.policiesTable.shouldHaveCellValue(
        name,
        'Schedules',
        new RegExp(expectedFrequency(schedule), 'i'),
      );
      await this.policiesTable.shouldHaveCellValue(name, 'Schedules', expectedRule(schedule));
      await this.policiesTable.shouldHaveCellValue(name, 'Schedules', expectedRetention(schedule));
      await this.policiesTable.shouldHaveCellValue(name, 'Timezone', timezone);
    });
  }

  async removePolicy(name: string): Promise<void> {
    await test.step(`Remove policy "${name}"`, async () => {
      // The list reloads itself whenever any worker's policy changes, and that closes the
      // popover an instant after it opens, so opening it is retried as a whole.
      await expect(async () => {
        await this.policiesTable.clickRowAction(name, 'Remove');
        await expect(this.removeConfirmation.panel.getLocator()).toBeVisible({ timeout: 2000 });
      }).toPass({ timeout: POLICY_LIST_RELOAD_TIMEOUT });

      await this.removeConfirmation.confirm();
    });
  }
}
