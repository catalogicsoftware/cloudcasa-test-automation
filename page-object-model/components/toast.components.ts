import { expect, Page, test } from '@playwright/test';
import { Container } from '@page-factory/container';
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

  /**
   * Watches for any toast whose text matches `pattern`, even one that appears and
   * auto-dismisses before a test gets around to asserting on it. Must be called before
   * the first navigation so the watcher is already attached at first paint.
   */
  async watchFor(pattern: RegExp): Promise<() => string[]> {
    const history: string[] = [];
    const handle = `__toastWatch_${Math.random().toString(36).slice(2)}`;
    await this.page.exposeFunction(handle, (text: string) => history.push(text));
    await this.page.addInitScript(
      ({ handle, source }) => {
        const matcher = new RegExp(source);
        const check = () => {
          const text = document.querySelector('app-toast')?.textContent ?? '';
          if (matcher.test(text)) {
            (window as unknown as Record<string, (text: string) => void>)[handle](text);
          }
        };
        new MutationObserver(check).observe(document.documentElement, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      },
      { handle, source: pattern.source },
    );
    return () => history;
  }
}
