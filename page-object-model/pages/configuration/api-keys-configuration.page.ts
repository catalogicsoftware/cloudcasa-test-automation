import test, { expect, Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { Button } from '@page-factory/button';
import { Table } from '@page-factory/table';
import { Title } from '@page-factory/title';
import { ApiKeyQuota } from '@data/api-keys';
import { API_KEYS_PATH, ApiKeyDrawer } from '@page-object-model/components/drawers/api-key.drawer';
import { ProceedConfirmation } from '@page-object-model/components/proceed-confirmation.components';

export class ApiKeysConfigurationPage extends BasePage {
  readonly heading = new Title({ page: this.page, locator: 'app-api-keys h4', name: 'API keys' });
  readonly quota = new Title({
    page: this.page,
    locator: 'app-api-keys h4 small',
    name: 'API keys quota',
  });
  readonly newApiKey = new Button({
    page: this.page,
    locator: 'app-api-keys button:has-text("New API key")',
    name: 'New API key',
  });
  readonly apiKeysTable = new Table({
    page: this.page,
    locator: 'app-api-keys table',
    name: 'API keys',
  });
  readonly apiKeyDrawer = new ApiKeyDrawer(this.page);
  readonly removeConfirmation = new ProceedConfirmation(this.page);

  constructor(page: Page) {
    super(page);
  }

  /** The quota counts the keys of the list request and reads "0 of M" until that list arrives. */
  async open(): Promise<void> {
    await test.step('Open the API keys page', async () => {
      const list = this.page.waitForResponse(
        response =>
          new URL(response.url()).pathname === API_KEYS_PATH &&
          response.request().method() === 'GET',
      );
      await this.goto('/configuration/api-keys');
      await list;
    });
  }

  /** Reads "N of M created" from the heading; call it after open() so the key list has arrived. */
  async readQuota(): Promise<ApiKeyQuota> {
    return test.step('Read the API keys quota', async () => {
      const text = await this.quota.getLocator().innerText();
      const match = /(\d+) of (\d+) created/.exec(text);
      if (!match) {
        throw new Error(`The API keys quota "${text}" does not read "N of M created"`);
      }
      return { created: Number(match[1]), limit: Number(match[2]) };
    });
  }

  /** The sidebar host measures 0x0 around its fixed-position panel, so the Name field is what signals it opened. */
  async openNewApiKeyDrawer(): Promise<ApiKeyDrawer> {
    await this.newApiKey.click();
    await this.apiKeyDrawer.name.getLocator().waitFor();
    return this.apiKeyDrawer;
  }

  /** The name cell links to the key's own drawer. */
  async openApiKey(name: RegExp): Promise<ApiKeyDrawer> {
    await test.step(`Open API key "${name}"`, async () => {
      await this.apiKeysTable.getRow(name).locator('a', { hasText: name }).click();
      await this.apiKeyDrawer.name.getLocator().waitFor();
    });
    return this.apiKeyDrawer;
  }

  /** The row renders Remove twice (hover panel and inline), which Table.clickRowAction refuses, so the hover panel's copy is clicked. */
  async startRemovingKey(name: RegExp): Promise<ProceedConfirmation> {
    await test.step(`Start removing API key "${name}"`, async () => {
      const row = this.apiKeysTable.getRow(name);
      const moreActions = row.locator('button.table__more-actions-wrapper');
      const remove = row.locator('.table__more-actions button.btn-ico', { hasText: 'Remove' });
      // A list reload drops the hover and closes the popover an instant after it opens, so both are retried as a whole.
      await expect(async () => {
        await moreActions.hover();
        await remove.click({ timeout: 2000 });
        await this.removeConfirmation.panel.getLocator().waitFor({ timeout: 2000 });
      }).toPass({ timeout: 20_000 });
    });
    return this.removeConfirmation;
  }
}
