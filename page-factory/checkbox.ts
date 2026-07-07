import { test } from '@playwright/test';
import { LocatorProps } from 'types/page-facotory/component';
import { Component } from './component';

export class Checkbox extends Component {
  get typeOf(): string {
    return 'checkbox';
  }

  async check(locatorProps: LocatorProps = {}): Promise<void> {
    await test.step(`Checking the ${this.typeOf} with name "${this.componentName}"`, async () => {
      const locator = this.getLocator(locatorProps);
      await locator.check();
    });
  }

  async uncheck(locatorProps: LocatorProps = {}): Promise<void> {
    await test.step(`Unchecking the ${this.typeOf} wiht name"${this.componentName}"`, async () => {
      const locator = this.getLocator(locatorProps);
      await locator.uncheck();
    });
  }
}
