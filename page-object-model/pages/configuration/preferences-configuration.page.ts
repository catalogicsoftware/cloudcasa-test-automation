import { Page, Response, test } from '@playwright/test';
import { BasePage } from '../base.page';
import { Button } from '@page-factory/button';
import { Checkbox } from '@page-factory/checkbox';
import { Container } from '@page-factory/container';
import { Input } from '@page-factory/input';
import { CcApiRoutes } from '@data/api-routes';
import { assertResponseOk } from '@utils/generic';

export class PreferencesConfigurationPage extends BasePage {
  readonly preferencesContainer = new Container({
    page: this.page,
    locator: 'app-preferences',
    name: 'Preferences',
  });
  /** Formly numbers the field id per form instance, so it is matched on its stable middle. */
  readonly organizationName = new Input({
    page: this.page,
    locator: 'app-preferences input[id*="input_display_name"]',
    name: 'Organization name',
  });
  /** The switch's label covers its input; Playwright retargets check state from a label to its control. */
  readonly yamlCatalogForBrowse = new Checkbox({
    page: this.page,
    locator: 'app-preferences label[for*="toggle_enable_yaml_catalog_for_browse"]',
    name: 'Enable viewing of resource YAML when browsing recovery points',
  });
  /** The switch label covers its input; Playwright retargets check() and toBeChecked() to the input. */
  readonly enableCloudAccounts = new Checkbox({
    page: this.page,
    locator: 'app-preferences label[for*="toggle_uiprefs.disabled_cloudaccounts"]',
    name: 'Enable cloud accounts',
  });
  readonly saveButton = new Button({
    page: this.page,
    locator: 'app-preferences button[type="submit"]',
    name: 'Save',
  });

  constructor(page: Page) {
    super(page);
  }

  /** Registered before the click; the page shows no toast, so the PUT is the only sign that the save landed. */
  async save(): Promise<void> {
    await test.step('Save the settings', async () => {
      const response = this.waitForSaveResponse();
      await this.saveButton.click();
      await assertResponseOk(await response, 'Save settings');
    });
  }

  private waitForSaveResponse(): Promise<Response> {
    return this.page.waitForResponse(
      result =>
        new URL(result.url()).pathname.startsWith(`/${CcApiRoutes.ORGS}/`) &&
        result.request().method() === 'PUT',
    );
  }
}
