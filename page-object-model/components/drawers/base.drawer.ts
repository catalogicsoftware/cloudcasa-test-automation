import { Page } from '@playwright/test';
import { Container } from '@page-fatory/container';
import { Button } from '@page-fatory/button';

/**
 * Base class for CloudCasa side drawers (Create Invitation, Add application hook,
 * Add object storage, ...). Holds what every drawer has: the root container,
 * the Cancel button and the primary footer button (its text differs per drawer —
 * Send / Save / Next — so it is passed by the subclass).
 *
 * All locators inside a drawer must be prefixed with `rootLocator` (see
 * `scoped()`) so that two drawers with identical buttons never collide.
 */
export abstract class BaseDrawer {
  readonly container: Container;
  readonly submit: Button;
  readonly cancel: Button;

  protected constructor(
    protected readonly page: Page,
    protected readonly rootLocator: string,
    drawerName: string,
    submitText: string = 'Save',
  ) {
    this.container = new Container({ page, locator: rootLocator, name: drawerName });
    this.submit = new Button({
      page,
      locator: this.scoped(`button:has-text("${submitText}")`),
      name: submitText,
    });
    this.cancel = new Button({
      page,
      locator: this.scoped('button:has-text("Cancel")'),
      name: 'Cancel',
    });
  }

  /** Prefixes a selector with the drawer root so it never matches outside the drawer. */
  protected scoped(selector: string): string {
    return `${this.rootLocator} ${selector}`;
  }

  async shouldBeOpened(): Promise<void> {
    await this.container.shouldBeVisible();
  }

  async submitForm(): Promise<void> {
    await this.submit.click();
  }

  async close(): Promise<void> {
    await this.cancel.click();
  }
}
