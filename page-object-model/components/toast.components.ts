import { expect, Page, test } from '@playwright/test';
import { Container } from '@page-fatory/container';
import { BACKEND_PROBE_TIMEOUT } from '@data/timeouts';

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
   * a zero-size wrapper, so a visibility check never passes.
   */
  async shouldShowError(message: RegExp, timeout = BACKEND_PROBE_TIMEOUT): Promise<void> {
    await test.step(`Error notification should report "${message}"`, async () => {
      await expect(this.notifications.getLocator(), {
        message: `No notification matching ${message} appeared`,
      }).toContainText(message, { timeout });
    });
  }
}
