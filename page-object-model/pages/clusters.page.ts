import { Page } from '@playwright/test';
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
}
