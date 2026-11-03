import test, { Request, Response } from '@playwright/test';
import { assertResponseOk } from '@utils/generic';
import { LocatorProps } from '../types/page-factory/component';
import { Component } from './component';

const RESPONSE_TIMEOUT = 30_000;
const REQUEST_START_TIMEOUT = 3_000;

function withTimeout<T>(promise: Promise<T>, timeout: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeout);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

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
    options: { method?: string; timeout?: number; assertOk?: boolean } = {},
    locatorProps: LocatorProps = {},
  ): Promise<Response> {
    return test.step(`Click on ${this.typeOf} "${this.componentName}" and wait for the triggered request to complete`, async () => {
      const locator = this.getLocator(locatorProps);
      const matchesUrl =
        typeof urlPredicate === 'string'
          ? (url: string) => url.includes(urlPredicate)
          : urlPredicate;
      const matchesRequest = (request: Request): boolean =>
        matchesUrl(request.url()) && (!options.method || request.method() === options.method);
      const triggerRequest = async (): Promise<Request> => {
        const requestPromise = this.page.waitForRequest(matchesRequest, {
          timeout: REQUEST_START_TIMEOUT,
        });
        await locator.click();
        return requestPromise;
      };

      let request: Request;
      try {
        request = await triggerRequest();
      } catch (error) {
        if (!(error instanceof Error) || !/Timeout/i.test(error.message)) throw error;
        request = await triggerRequest();
      }

      const response = await withTimeout<Response | null>(
        request.response(),
        options.timeout ?? RESPONSE_TIMEOUT,
        `${this.typeOfUpper} "${this.componentName}" request did not receive a response`,
      );
      if (!response) throw new Error(`${this.typeOfUpper} "${this.componentName}" request failed`);
      if (options.assertOk !== false) {
        await assertResponseOk(response, `${this.typeOfUpper} "${this.componentName}" request`);
      }
      return response;
    });
  }
}
