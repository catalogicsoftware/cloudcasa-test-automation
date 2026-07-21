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

  async shouldBeDisabled(locatorProps: LocatorProps = {}): Promise<void> {
    await test.step(`${this.typeOfUpper} "${this.componentName}" should be disabled`, async () => {
      const locator = this.getLocator(locatorProps);
      await expect(locator, { message: this.getErrorMessage(' is not disabled') }).toBeDisabled();
    });
  }

  async click(locatorProps: LocatorProps = {}): Promise<void> {
    await test.step(`Click on ${this.typeOf} "${this.componentName}"`, async () => {
      const locator = this.getLocator(locatorProps);
      await locator.click();
    });
  }

  /**
   * Some SPA routes re-render the clicked element as "active" mid-click,
   * detaching it before Playwright's actionability retry resolves and
   * hanging the click indefinitely. The URL change is the real signal that
   * navigation succeeded, so a click that times out but still lands on the
   * right URL isn't a failure — only a genuine click error (element never
   * found, strict-mode violation, ...) should still fail fast.
   */
  async clickAndWaitForUrl(
    urlPattern: string | RegExp,
    locatorProps: LocatorProps = {},
  ): Promise<void> {
    await test.step(`Click on ${this.typeOf} "${this.componentName}" and wait for URL to match "${urlPattern}"`, async () => {
      const locator = this.getLocator(locatorProps);
      await locator.click({ timeout: 10000 }).catch(error => {
        if (!/Timeout/i.test(error.message)) {
          throw error;
        }
      });
      await expect(this.page, {
        message: this.getErrorMessage(`did not navigate to a URL matching "${urlPattern}"`),
      }).toHaveURL(urlPattern);
    });
  }
}
