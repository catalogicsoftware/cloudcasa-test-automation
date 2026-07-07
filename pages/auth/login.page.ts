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
  readonly goBackLink = new Link({
    page: this.page,
    locator: '#btn-back-login',
    name: 'Go Back',
  });
  readonly errorMessage = new Title({
    page: this.page,
    locator: '#error-message',
    name: 'Error Message',
  });
  readonly resetSuccessMessage = new Title({
    page: this.page,
    locator: '#success-message',
    name: 'Reset Success Message',
  });
  readonly signUpLink = new Link({ page: this.page, locator: '.text-center > a', name: 'Sign Up' });

  constructor(page: Page) {
    super(page);
  }

  async goto(url: string = '/'): Promise<void> {
    // The login form is served by an Auth0-hosted widget that renders its
    // markup before it has fetched this challenge and wired up its click
    // handlers, so a click right after navigation can silently be a no-op.
    const challengeResponse = this.page.waitForResponse(response =>
      response.url().includes('/usernamepassword/challenge'),
    );

    await super.goto(url);
    await this.emailInput.getLocator().waitFor({ state: 'visible' });
    await challengeResponse;
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email, { validateValue: true });
    await this.passwordInput.fill(password, { validateValue: true });
    await this.signInButton.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordButton.click();
  }

  async clickGoBackToLogin() {
    await this.goBackLink.click();
  }

  async clickSignUp() {
    await this.signUpLink.click();
  }
}
