import { Page } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Radio } from '@page-factory/radio';
import { Title } from '@page-factory/title';

export class UserHelpModal {
  readonly title: Title;
  readonly closeButton: Button;
  readonly bookDemoOption: Radio;
  readonly openDocumentationOption: Radio;
  readonly doNotShowAgainOption: Radio;
  readonly confirmButton: Button;

  constructor(page: Page) {
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
    this.doNotShowAgainOption = new Radio({
      page,
      locator: this.optionInputLocator('Please do not show this popup again'),
      name: 'Please do not show this popup again',
    });
    this.confirmButton = new Button({
      page,
      locator: '.modal-footer .btn-accent',
      name: 'Confirm',
    });
  }

  private optionInputLocator(labelText: string): string {
    return `.custom-radio:has(label:text-is("${labelText}")) input`;
  }

  async closeModal(): Promise<void> {
    await this.closeButton.click();
  }
}
