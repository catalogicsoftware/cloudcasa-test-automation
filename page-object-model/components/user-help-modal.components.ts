import { Page } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { Radio } from '@page-factory/radio';
import { Title } from '@page-factory/title';

export class UserHelpModal {
  readonly container: Container;
  readonly title: Title;
  readonly closeButton: Button;
  readonly bookDemoOption: Radio;
  readonly openDocumentationOption: Radio;
  readonly doNotShowAgainOption: Button;
  readonly confirmButton: Button;

  constructor(page: Page) {
    this.container = new Container({ page, locator: 'app-help-user', name: 'Help modal' });
    this.title = new Title({ page, locator: '.modal-title', name: 'Need some help?' });
    this.closeButton = new Button({ page, locator: '.close', name: 'Close' });
    this.bookDemoOption = new Radio({
      page,
      locator: this.optionInputLocator('Book a demo session with a CloudCasa expert'),
      name: 'Book a demo session with a CloudCasa expert',
    });
    this.openDocumentationOption = new Radio({
      page,
      locator: this.optionInputLocator('Open documentation'),
      name: 'Open documentation',
    });
    // The input does not register clicks reliably in this modal, so select its label.
    this.doNotShowAgainOption = new Button({
      page,
      locator: 'app-help-user label:has-text("Please do not show this popup again")',
      name: 'Please do not show this popup again',
    });
    this.confirmButton = new Button({
      page,
      locator: 'app-help-user button[type="submit"]',
      name: 'Confirm',
    });
  }

  private optionInputLocator(labelText: string): string {
    return `.custom-radio:has(label:text-is("${labelText}")) input`;
  }

  async closeModal(): Promise<void> {
    await this.closeButton.click();
  }

  // The modal can reappear after navigation unless the user disables it.
  async closeIfVisible(): Promise<void> {
    if (await this.closeButton.getLocator().isVisible()) {
      await this.closeModal();
    }
  }

  async selectDoNotShowAgain(): Promise<void> {
    await this.doNotShowAgainOption.click();
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }
}
