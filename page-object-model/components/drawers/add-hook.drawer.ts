import { Page, test } from '@playwright/test';
import { Input } from '@page-factory/input';
import { Radio } from '@page-factory/radio';
import { BaseDrawer } from './base.drawer';

export type HookType = 'PRE_BACKUP' | 'POST_BACKUP' | 'POST_RESTORE' | 'COMMON';

export class AddHookDrawer extends BaseDrawer {
  readonly name: Input;
  readonly hookType: Radio;
  readonly command: Input;

  constructor(page: Page) {
    super(page, 'app-hooks-sidebar', 'Add application hook', 'Save');

    this.name = new Input({
      page,
      locator: this.scoped('input[id*="input_name"]'),
      name: 'Name',
    });
    this.hookType = new Radio({
      page,
      locator: this.scoped('input[id*="radio_hook_type"]'),
      name: 'Type',
    });
    this.command = new Input({
      page,
      locator: this.scoped('app-input-code textarea'),
      name: 'Command',
    });
  }

  /** The sidebar host only wraps a fixed-position panel, so it measures 0x0 — the Name field is the real open signal. */
  async shouldBeOpened(): Promise<void> {
    await this.name.shouldBeVisible();
  }

  async fillRequiredFields(name: string, hookType: HookType, command: string): Promise<void> {
    await test.step(`Fill the required fields of the "Add application hook" drawer`, async () => {
      await this.name.fill(name);
      await this.hookType.select({ value: hookType });
      await this.command.fill(command);
    });
  }
}
