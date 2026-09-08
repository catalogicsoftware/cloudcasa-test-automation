import { BasePage } from '@page-object-model/pages/base.page';
import { expect, Page, test } from '@playwright/test';
import { ConfigurationSidebar } from '@page-object-model/components/configuration-sidebar.components';
import { Container } from '@page-factory/container';

export class ConfigurationPage extends BasePage {
  readonly configurationContainer: Container = new Container({
    page: this.page,
    locator: 'app-configuration',
    name: 'Configuration',
  });
  readonly configurationSideBar: ConfigurationSidebar = new ConfigurationSidebar(this.page);

  constructor(page: Page) {
    super(page);
  }

  async shouldOpen(): Promise<void> {
    await test.step('Configuration page should be opened', async () => {
      await expect(this.page).toHaveURL(/configuration/);
      await this.configurationContainer.shouldBeVisible();
    });
  }
}
