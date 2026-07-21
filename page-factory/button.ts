import test from '@playwright/test';
import { assertResponseOk } from '@utils/generic';
import { LocatorProps } from '../types/page-facotory/component';
import { Component } from './component';

export class Button extends Component {
  get typeOf(): string {
    return 'button';
  }

  async hover(locatorProps: LocatorProps = {}): Promise<void> {
    await test.step(`Hovering the ${this.typeOf}  with name "${this.componentName}"`, async () => {
      const locator = this.getLocator(locatorProps);
      await locator.hover();
    });
  }

  async doubleClick(locatorProps: LocatorProps = {}): Promise<void> {
    await test.step(`Double clicking the ${this.typeOf}  with name "${this.componentName}"`, async () => {
      const locator = this.getLocator(locatorProps);
      await locator.dblclick();
    });
  }

  /**
   * Clicking only queues the SPA's HTTP call — navigating away right after can
   * abort it before it ever reaches the backend. Registering the response wait
   * before the click (not after) avoids the race where the response arrives
   * before the listener does.
   */
  async clickAndWaitForResponse(
    urlPredicate: string | ((url: string) => boolean),
    options: { method?: string } = {},
    locatorProps: LocatorProps = {},
  ): Promise<void> {
    await test.step(`Click on ${this.typeOf} "${this.componentName}" and wait for the triggered request to complete`, async () => {
      const locator = this.getLocator(locatorProps);
      const matchesUrl =
        typeof urlPredicate === 'string'
          ? (url: string) => url.includes(urlPredicate)
          : urlPredicate;
      const responsePromise = this.page.waitForResponse(
        response =>
          matchesUrl(response.url()) &&
          (!options.method || response.request().method() === options.method),
      );
      await locator.click();
      const response = await responsePromise;
      await assertResponseOk(response, `${this.typeOfUpper} "${this.componentName}" request`);
    });
  }
}
