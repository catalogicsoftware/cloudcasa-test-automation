import test, { expect, Locator } from '@playwright/test';
import { LocatorProps } from '../types/page-facotory/component';
import { Component } from './component';

type SelectProps = { validateValue?: boolean } & LocatorProps;
type SelectByTextProps = {
  /** Filter the options via the menu's search field before clicking. Useful for long, paginated lists. */
  search?: boolean;
  /** Override the option selector when the widget differs from app-input-select-filter. */
  optionLocator?: string;
  /** The menu is multi-select and stays open after a click; pass true to keep it open for further selections. */
  keepOpen?: boolean;
} & LocatorProps;

export class Dropdown extends Component {
  get typeOf(): string {
    return 'dropdown';
  }

  /** The mat-menu overlay panel — rendered in .cdk-overlay-container, outside the trigger. */
  private get menu(): Locator {
    return this.page.locator('.mat-menu-panel');
  }

  /** For native <select> elements. */
  async selectOption(value: string, selectProps: SelectProps = {}): Promise<void> {
    const { validateValue, ...locatorProps } = selectProps;

    await test.step(`Select option "${value}" in ${this.typeOf} "${this.componentName}"`, async () => {
      const locator = this.getLocator(locatorProps);
      await locator.selectOption(value);

      if (validateValue) {
        await this.shouldHaveValue(value, locatorProps);
      }
    });
  }

  /**
   * For CloudCasa custom dropdowns (app-input-select-filter, mat-menu based):
   * opens the menu, clicks the option and closes the menu. Selection does not
   * close the menu by itself and Escape is not handled — only the footer
   * "close" button (or backdrop click) dismisses it.
   */
  async selectByText(optionText: string, selectProps: SelectByTextProps = {}): Promise<void> {
    const { search, optionLocator, keepOpen, ...locatorProps } = selectProps;

    await test.step(`Select option "${optionText}" in ${this.typeOf} "${this.componentName}"`, async () => {
      await this.getLocator(locatorProps).click();
      await this.menu.waitFor({ state: 'visible' });

      if (search) {
        await this.menu.locator('input[name="searchField"]').fill(optionText);
      }

      const option = optionLocator
        ? this.page.locator(optionLocator, { hasText: optionText })
        : this.menu.locator('button.mat-menu-item', { hasText: optionText });
      await option.click();

      if (!keepOpen) {
        await this.closeMenu();
      }
    });
  }

  /** Closes the open menu via its footer "close" button. */
  async closeMenu(): Promise<void> {
    await test.step(`Close ${this.typeOf} "${this.componentName}" menu`, async () => {
      await this.menu.locator('button.btn', { hasText: 'close' }).click();
      await this.menu.waitFor({ state: 'detached' });
    });
  }

  /** Removes a selected value by clicking the "x" on its badge inside the trigger. */
  async unselectByText(optionText: string, locatorProps: LocatorProps = {}): Promise<void> {
    await test.step(`Unselect option "${optionText}" in ${this.typeOf} "${this.componentName}"`, async () => {
      const badge = this.getLocator(locatorProps).locator('.badge', { hasText: optionText });
      await badge.locator('button').click();
    });
  }

  /** Checks that the trigger shows a badge with the selected value. */
  async shouldHaveSelected(optionText: string, locatorProps: LocatorProps = {}): Promise<void> {
    await test.step(`Checking that ${this.typeOf} "${this.componentName}" has selected value "${optionText}"`, async () => {
      const badge = this.getLocator(locatorProps).locator('.badge', { hasText: optionText });
      await expect(badge).toBeVisible();
    });
  }

  /** For native <select> elements. */
  async shouldHaveValue(value: string, locatorProps: LocatorProps = {}): Promise<void> {
    await test.step(`Checking that ${this.typeOf} "${this.componentName}" has a value "${value}"`, async () => {
      const locator = this.getLocator(locatorProps);
      await expect(locator).toHaveValue(value);
    });
  }
}
