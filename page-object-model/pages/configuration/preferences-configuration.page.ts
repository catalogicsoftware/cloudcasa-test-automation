import { Page } from '@playwright/test';
import { BasePage } from '../base.page';
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

  constructor(page: Page) {
    super(page);
  }
}
