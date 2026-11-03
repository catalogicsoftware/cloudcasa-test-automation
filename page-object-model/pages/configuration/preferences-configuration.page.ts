import { Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { Button } from '@page-factory/button';
import { Checkbox } from '@page-factory/checkbox';
import { Container } from '@page-factory/container';
import { Input } from '@page-factory/input';

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
  readonly save = new Button({
    page: this.page,
    locator: 'app-preferences button:text-is("Save")',
    name: 'Save',
  });

  constructor(page: Page) {
    super(page);
  }
}
