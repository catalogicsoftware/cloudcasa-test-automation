import { expect, Locator, Page, test } from '@playwright/test';
import { ComponentProps, LocatorProps } from '../types/page-facotory/component';
import { capitalizeFirstLetter } from '../utils/generic';

export abstract class Component {
  page: Page;
  locator: string;
  private name: string | undefined;

  constructor({ page, locator, name }: ComponentProps) {
    this.page = page;
    this.locator = locator;
    this.name = name;
  }

  getLocator(props: LocatorProps = {}): Locator {
    const locator = props.locator || this.locator;
    return this.page.locator(locator);
  }

  get typeOf(): string {
    return 'component';
  }

  get typeOfUpper(): string {
    return capitalizeFirstLetter(this.typeOf);
  }

  get componentName(): string {
    if (!this.name) {
      throw Error('Provide "name" property to use "componentName"');
    }

    return this.name;
  }

  private getErrorMessage(action: string): string {
    return `The ${this.typeOf} with name "${this.componentName}" and locator "${this.locator}" ${action}`;
  }

  async shouldBeVisible(locatorProps: LocatorProps = {}): Promise<void> {
    await test.step(`${this.typeOfUpper} "${this.componentName}" should be visible on the page`, async () => {
      const locator = this.getLocator(locatorProps);
      await expect(locator, {
        message: this.getErrorMessage('is not visible on the page'),
      }).toBeVisible();
    });
  }

  async shouldHaveText(text: string, locatorProps: LocatorProps = {}): Promise<void> {
    await test.step(`${this.typeOfUpper} "${this.componentName}" should have text "${text}"`, async () => {
      const locator = this.getLocator(locatorProps);
      await expect(locator, {
        message: this.getErrorMessage(`does not have text "${text}"`),
      }).toContainText(text);
    });
  }

  async shouldBeEnabled(locatorProps: LocatorProps = {}): Promise<void> {
    await test.step(`${this.typeOfUpper} "${this.componentName}" should be enabled`, async () => {
      const locator = this.getLocator(locatorProps);
      await expect(locator, { message: this.getErrorMessage(' is not enabled') }).toBeEnabled();
    });
  }

  async click(locatorProps: LocatorProps = {}): Promise<void> {
    await test.step(`Click on ${this.typeOf} "${this.componentName}"`, async () => {
      const locator = this.getLocator(locatorProps);
      await locator.click();
    });
  }
}
