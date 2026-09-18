import { Page } from '@playwright/test';
import { Button } from '@page-factory/button';

export class UserHelpModal {
  readonly closeButton: Button;

  constructor(page: Page) {
    this.closeButton = new Button({ page, locator: '.close', name: 'Close' });
  }

  async closeModal(): Promise<void> {
    await this.closeButton.click();
  }

  // The modal is not dismissed for the session unless the user picks "do not show this
  // popup again", so it can reappear after a reload or a full-page navigation.
  async closeIfVisible(): Promise<void> {
    if (await this.closeButton.getLocator().isVisible()) {
      await this.closeModal();
    }
  }
}
