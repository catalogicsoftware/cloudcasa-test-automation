import { expect, Page, Response, test } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { Button } from '@page-factory/button';
import { Checkbox } from '@page-factory/checkbox';
import { Container } from '@page-factory/container';
import { Dropdown } from '@page-factory/dropdown';
import { Input } from '@page-factory/input';
import { CcApiRoutes } from '@data/api-routes';
import { BACKEND_PROBE_TIMEOUT } from '@data/timeouts';
import type { ScheduleCase } from '../../../types/data/policy';

const DIALOG = 'mat-dialog-container app-policy';

/**
 * Formly numbers the field ids per form instance (`formly_24_input_hours_4`), so ids are
 * matched on their stable middle. Every frequency keeps its own group of HH/MM/AM-PM fields
 * in the DOM and hides all but the active one, hence `:visible` on the shared names.
 */
export class AddPolicyDialog {
  readonly dialog: Container;
  readonly policyName: Input;
  readonly timezone: Dropdown;
  readonly repeatEveryDays: Input;
  readonly dayOfMonth: Input;
  readonly everyMonths: Input;
  readonly hours: Input;
  readonly minutes: Input;
  readonly meridiem: Dropdown;
  readonly cron: Input;
  readonly retentionDays: Input;
  readonly hourly: Button;
  readonly addToSchedule: Button;
  readonly createPolicy: Button;
  readonly cancel: Button;

  constructor(protected readonly page: Page) {
    this.dialog = new Container({ page, locator: DIALOG, name: 'Add policy' });
    this.policyName = new Input({
      page,
      locator: `${DIALOG} input[id*="input_name"]`,
      name: 'Policy name',
    });
    this.timezone = new Dropdown({
      page,
      locator: `${DIALOG} select[id*="select_timezone"]`,
      name: 'Timezone',
    });
    this.repeatEveryDays = new Input({
      page,
      locator: `${DIALOG} input[id*="input_days"]:visible`,
      name: 'Repeat every days',
    });
    this.dayOfMonth = new Input({
      page,
      locator: `${DIALOG} input[id*="input_dayOfMonth"]:visible`,
      name: 'Day of month',
    });
    this.everyMonths = new Input({
      page,
      locator: `${DIALOG} input[id*="input_month"]:visible`,
      name: 'Every months',
    });
    this.hours = new Input({
      page,
      locator: `${DIALOG} input[id*="input_hours"]:visible`,
      name: 'HH',
    });
    this.minutes = new Input({
      page,
      locator: `${DIALOG} input[id*="input_minutes"]:visible`,
      name: 'MM',
    });
    this.meridiem = new Dropdown({
      page,
      locator: `${DIALOG} select[id*="select_isPM"]:visible`,
      name: 'AM/PM',
    });
    this.cron = new Input({
      page,
      locator: `${DIALOG} input[id*="input_cron"]`,
      name: 'Custom cron',
    });
    this.retentionDays = new Input({
      page,
      locator: `${DIALOG} input[id*="input_retainDays"]`,
      name: 'Retention day(s)',
    });
    this.hourly = new Button({ page, locator: this.frequencyLocator('Hourly'), name: 'Hourly' });
    this.addToSchedule = new Button({
      page,
      locator: `${DIALOG} button:has-text("Add to schedule")`,
      name: 'Add to schedule',
    });
    this.createPolicy = new Button({
      page,
      locator: `${DIALOG} button:has-text("Create policy")`,
      name: 'Create policy',
    });
    this.cancel = new Button({
      page,
      locator: `${DIALOG} button:text-is("Cancel")`,
      name: 'Cancel',
    });
  }

  private frequencyLocator(frequency: string): string {
    return `${DIALOG} app-input-switch-buttons button:text-is("${frequency}")`;
  }

  private weekdayCheckbox(weekdayId: string): Checkbox {
    return new Checkbox({
      page: this.page,
      locator: `${DIALOG} input[id="repeatDaydate.short_day.${weekdayId}"]`,
      name: weekdayId,
    });
  }

  async shouldBeOpened(): Promise<void> {
    await test.step('Add policy dialog should be opened', async () => {
      await this.dialog.shouldBeVisible();
      await this.policyName.shouldBeVisible();
    });
  }

  /**
   * The zone name, not the option's value attribute: Angular writes an index into
   * the latter ("12: Europe/Warsaw"), so only the label is comparable to the table.
   */
  private async selectedTimezone(): Promise<string> {
    return (await this.timezone.getLocator().locator('option:checked').innerText()).trim();
  }

  /** The select is prefilled with the browser's timezone, which differs between a local run and CI. */
  async defaultTimezone(): Promise<string> {
    return test.step('Read the timezone the dialog preselected', async () =>
      this.selectedTimezone());
  }

  /** Picks a timezone out of the options the app itself offers, so no random value can miss the list. */
  async selectRandomTimezone(): Promise<string> {
    return test.step('Select a random timezone', async () => {
      const options = await this.timezone.getLocator().locator('option').allInnerTexts();
      const timezone = faker.helpers.arrayElement(
        options.map(option => option.trim()).filter(Boolean),
      );

      await this.timezone.getLocator().selectOption({ label: timezone });
      expect(await this.selectedTimezone()).toBe(timezone);
      return timezone;
    });
  }

  async selectFrequency(frequency: ScheduleCase['frequency']): Promise<void> {
    await new Button({
      page: this.page,
      locator: this.frequencyLocator(frequency),
      name: frequency,
    }).click();
  }

  /** The Custom branch alone, so an expression the backend refuses needs no rule text to go with it. */
  async addCronSchedule(cron: string, retentionDays: number): Promise<void> {
    await test.step(`Add a cron schedule "${cron}"`, async () => {
      await this.selectFrequency('Custom');
      await this.cron.fill(cron);
      await this.retentionDays.fill(String(retentionDays));
      await this.addToSchedule.shouldBeEnabled();
      await this.addToSchedule.click();
    });
  }

  /** Fills the frequency's own fields, the shared time and the retention, then adds the schedule. */
  async addSchedule(schedule: ScheduleCase): Promise<void> {
    // Custom spells the time out inside the expression and keeps no HH/MM/AM-PM fields of its own.
    if (schedule.frequency === 'Custom') {
      await this.addCronSchedule(schedule.cron, schedule.retentionDays);
      return;
    }

    await test.step(`Add a ${schedule.label} schedule`, async () => {
      await this.selectFrequency(schedule.frequency);

      switch (schedule.frequency) {
        case 'Daily':
          await this.repeatEveryDays.fill(String(schedule.interval));
          break;
        case 'Weekly':
          await this.weekdayCheckbox(schedule.weekday.id).check();
          break;
        case 'Monthly':
          await this.dayOfMonth.fill(String(schedule.dayOfMonth));
          await this.everyMonths.fill(String(schedule.interval));
          break;
      }

      await this.hours.fill(String(schedule.time.hour));
      await this.minutes.fill(String(schedule.time.minute));
      await this.meridiem.selectOption(schedule.time.meridiem);
      await this.retentionDays.fill(String(schedule.retentionDays));

      // Asserted before the click: an out-of-range field only disables the button, so clicking
      // straight away would spend the whole test timeout waiting instead of reporting the value.
      await this.addToSchedule.shouldBeEnabled();
      // Nothing is added to the policy until this button is pressed, and Create policy stays disabled until then.
      await this.addToSchedule.click();
    });
  }

  async createExpectingRejection(): Promise<number> {
    return test.step('Create the policy expecting the backend to reject it', async () => {
      await this.createPolicy.shouldBeEnabled();

      const response = this.waitForCreateResponse();
      await this.createPolicy.click();
      return (await response).status();
    });
  }

  /** Registered before the click; own wait since a rejection here must not assert 2xx. */
  private waitForCreateResponse(): Promise<Response> {
    return this.page.waitForResponse(
      result =>
        new URL(result.url()).pathname === `/${CcApiRoutes.POLICIES}` &&
        result.request().method() === 'POST',
      { timeout: BACKEND_PROBE_TIMEOUT },
    );
  }

  async create(): Promise<void> {
    await test.step('Create the policy', async () => {
      await this.createPolicy.click();
      await expect(this.dialog.getLocator()).toHaveCount(0);
    });
  }
}
