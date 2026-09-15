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
}
