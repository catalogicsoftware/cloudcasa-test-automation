import { expect, Page, test } from '@playwright/test';
import { Container } from '@page-fatory/container';

/**
 * Global notification area. Backend validation failures surface here and
 * nowhere else — the form that triggered them is already gone by then.
 */
export class Toast {
  readonly notifications: Container;

  constructor(protected readonly page: Page) {
    this.notifications = new Container({ page, locator: 'app-toast', name: 'Notifications' });
  }

  /**
   * Asserts on the host's text rather than a single toast element: the host is
   * a zero-size wrapper, so a visibility check never passes. Backend-side
   * validation (bucket reachability, credentials) runs on save and can take
   * tens of seconds, hence the explicit timeout instead of the 5s default.
   */
  async shouldShowError(message: RegExp, timeout = 90000): Promise<void> {
    await test.step(`Error notification should report "${message}"`, async () => {
      await expect(this.notifications.getLocator(), {
        message: `No notification matching ${message} appeared`,
      }).toContainText(message, { timeout });
    });
  }
}
