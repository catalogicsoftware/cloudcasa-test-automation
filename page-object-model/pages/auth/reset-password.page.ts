import { Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { Button } from '../../../page-factory/button';
import { Input } from '../../../page-factory/input';
import { Title } from '../../../page-factory/title';

// This is Auth0's hosted "Change Password" page (an auth0-lock widget served from
// the tenant's custom domain), not part of the CloudCasa Angular app.
export class ResetPasswordPage extends BasePage {
  readonly newPasswordInput = new Input({
    page: this.page,
    locator: 'input[placeholder="your new password"]',
    name: 'New Password',
  });
  readonly confirmPasswordInput = new Input({
    page: this.page,
    locator: 'input[placeholder="confirm your new password"]',
    name: 'Confirm New Password',
  });
  readonly submitButton = new Button({
    page: this.page,
    locator: 'button.auth0-lock-submit',
    name: 'Change Password',
  });
  readonly successMessage = new Title({
    page: this.page,
    locator: 'text=Your password has been reset successfully.',
    name: 'Password Changed Message',
  });

  constructor(page: Page) {
    super(page);
  }

  async openResetLink(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'load' });
    await this.newPasswordInput.getLocator().waitFor({ state: 'visible' });
  }

  async setNewPassword(password: string): Promise<void> {
    await this.newPasswordInput.fill(password, { validateValue: true });
    await this.confirmPasswordInput.fill(password, { validateValue: true });
    await this.submitButton.click();
  }
}
