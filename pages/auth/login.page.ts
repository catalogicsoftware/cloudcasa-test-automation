import { Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { Button } from '../../page-factory/button';
import { Input } from '../../page-factory/input';
import { Link } from '../../page-factory/link';
import { Title } from '../../page-factory/title';

export class LoginPage extends BasePage {
  readonly emailInput = new Input({ page: this.page, locator: '#email', name: 'Email' });
  readonly passwordInput = new Input({ page: this.page, locator: '#password', name: 'Password' });
  readonly signInButton = new Button({ page: this.page, locator: '#btn-login', name: 'Sign In' });
  readonly forgotPasswordButton = new Button({
    page: this.page,
    locator: '#btn-reset-pwd',
    name: 'Forgot Password',
  });
  readonly goBackLink = new Link({ page: this.page, locator: '#btn-back-login', name: 'Go Back' });
  readonly errorMessage = new Title({
    page: this.page,
    locator: '#error-message',
    name: 'Error Message',
  });
  readonly resetSuccessMessage = new Title({
    page: this.page,
    locator: '#message-reset-success',
    name: 'Reset Success Message',
  });
  readonly signUpLink = new Link({ page: this.page, locator: '.text-center > a', name: 'Sign Up' });

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/');
    // Works for both cloud (/login) and on-prem (/dex/auth/local/login?state=...)
    // The app redirects to whichever login page applies for the environment
    await this.emailInput.getLocator().waitFor({ state: 'visible' });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
