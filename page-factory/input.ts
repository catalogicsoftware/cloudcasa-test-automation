import test, { expect } from '@playwright/test';
import { LocatorProps } from '../types/page-facotory/component';
import { Component } from './component';

type FillProps = { validateValue?: boolean } & LocatorProps;

export class Input extends Component {
  get typeOf(): string {
    return 'input';
  }

  async fill(value: string, fillProps: FillProps = {}): Promise<void> {
    const { validateValue, ...locatorProps } = fillProps;

    await test.step(`Fill ${this.typeOf} "${this.componentName}" with value "${value}"`, async () => {
      const locator = this.getLocator(locatorProps);
      await locator.fill(value);

      if (validateValue) {
        await this.shouldHaveValue(value, locatorProps);
      }
    });
  }

  async shouldHaveValue(value: string, locatorProps: LocatorProps = {}): Promise<void> {
    await test.step(`Checking that ${this.typeOf} "${this.componentName}" has a value "${value}"`, async () => {
      const locator = this.getLocator(locatorProps);
      await expect(locator).toHaveValue(value);
    });
  }
}
