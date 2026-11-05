import { Page, test } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { Dropdown } from '@page-factory/dropdown';
import { Input } from '@page-factory/input';
import { CcApiRoutes } from '@data/api-routes';
import { BaseDrawer } from './base.drawer';

export const API_KEYS_PATH = `/${CcApiRoutes.API_KEYS}`;

/** One sidebar serves both a new key and an existing one; only a new key gets its secret shown, below the form. */
export class ApiKeyDrawer extends BaseDrawer {
  readonly name: Input;
  readonly roles: Dropdown;
  readonly copyHint: Container;
  readonly secret: Container;
  readonly copySecretButton: Button;
  readonly closeDrawer: Button;

  constructor(page: Page) {
    super(page, 'app-api-key-sidebar', 'API key', 'Generate');

    this.name = new Input({
      page,
      locator: this.scoped('input[id*="input_name"]'),
      name: 'Name',
    });
    this.roles = new Dropdown({
      page,
      locator: this.scoped('.form-group:has(label[for*="roles"]) button.mat-menu-trigger'),
      name: 'Roles',
    });
    this.copyHint = new Container({
      page,
      locator: this.scoped('.alert-info'),
      name: 'Copy the key hint',
    });
    this.secret = new Container({
      page,
      locator: this.scoped('app-copy-paste .alert > div'),
      name: 'API key secret',
    });
    this.copySecretButton = new Button({
      page,
      locator: this.scoped('app-copy-paste button'),
      name: 'Copy the API key',
    });
    this.closeDrawer = new Button({
      page,
      locator: this.scoped('.sidebar-actions button:text-is("Close")'),
      name: 'Close',
    });
  }

  async generate(): Promise<void> {
    await this.submit.clickAndWaitForResponse(url => new URL(url).pathname === API_KEYS_PATH, {
      method: 'POST',
    });
  }

  /** Goes through the drawer's own copy button, so the value is what a user would paste into an integration. */
  async copySecret(): Promise<string> {
    return test.step('Copy the API key secret', async () => {
      await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await this.copySecretButton.click();
      return this.page.evaluate(() => navigator.clipboard.readText());
    });
  }
}
