import { expect, Page, test } from '@playwright/test';
import { BasePage } from './base.page';
import { Container } from '@page-factory/container';
import { Title } from '@page-factory/title';

export class ClustersPage extends BasePage {
  readonly clustersContainer = new Container({
    page: this.page,
    locator: 'app-clusters',
    name: 'Clusters',
  });
  readonly heading = new Title({
    page: this.page,
    locator: 'app-clusters h4',
    name: 'Clusters Heading',
  });

  constructor(page: Page) {
    super(page);
  }

  async shouldOpen(): Promise<void> {
    await test.step('Clusters page should be opened', async () => {
      await expect(this.page).toHaveURL(/\/clusters/);
      await this.clustersContainer.shouldBeVisible();
    });
  }
}
