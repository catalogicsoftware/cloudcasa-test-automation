import test, { expect } from '@playwright/test';
import { LocatorProps } from '../types/page-factory/component';
import { Component } from './component';

type FillProps = { validateValue?: boolean; secret?: boolean } & LocatorProps;

export class Input extends Component {
  get typeOf(): string {
    return 'input';
  }

  /**
   * Step titles end up in the HTML report, Allure and junit.xml, so `secret`
   * keeps a credential out of the titles this repo writes. Playwright's own
   * nested fill step still records the value (see page-factory/README.md).
   */
  async fill(value: string, fillProps: FillProps = {}): Promise<void> {
    const { validateValue, secret, ...locatorProps } = fillProps;
    const shown = secret ? 'a hidden value' : `value "${value}"`;

    await test.step(`Fill ${this.typeOf} "${this.componentName}" with ${shown}`, async () => {
      const locator = this.getLocator(locatorProps);
      await locator.fill(value);

      if (validateValue) {
        await this.shouldHaveValue(value, { ...locatorProps, secret });
      }
    });
  }

  async shouldHaveValue(
    value: string,
    props: { secret?: boolean } & LocatorProps = {},
  ): Promise<void> {
    const { secret, ...locatorProps } = props;
    const shown = secret ? 'a hidden value' : `a value "${value}"`;

    await test.step(`Checking that ${this.typeOf} "${this.componentName}" has ${shown}`, async () => {
      const locator = this.getLocator(locatorProps);
      await expect(locator).toHaveValue(value);
    });
  }
}
