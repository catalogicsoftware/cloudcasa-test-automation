import { Page, test } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Input } from '@page-factory/input';
import { BaseDrawer } from './base.drawer';
import { CcApiRoutes } from '@data/api-routes';
import { assertResponseOk } from '@utils/generic';

export class AddClusterSidebar extends BaseDrawer {
  readonly name: Input;
  readonly description: Input;
  readonly advancedOptionsToggle: Button;
  readonly imagePullSecretName: Input;

  constructor(page: Page) {
    super(page, 'app-cluster-sidebar', 'Add Cluster', 'Register');

    this.name = new Input({
      page,
      locator: this.scoped('input[id*="input_name"]:visible'),
      name: 'Name',
    });
    this.description = new Input({
      page,
      locator: this.scoped('input[id*="input_description"]:visible'),
      name: 'Description',
    });
    this.advancedOptionsToggle = new Button({
      page,
      locator: this.scoped('mat-expansion-panel-header:has-text("Advanced options")'),
      name: 'Advanced options',
    });
    this.imagePullSecretName = new Input({
      page,
      locator: this.scoped('input[id*="input_image_pull_secret_name"]:visible'),
      name: 'Image pull secret',
    });
  }

  /**
   * The host element only wraps a fixed-position panel, so it measures 0x0 and never counts
   * as visible — the Name field is the reliable open signal (see AddObjectStorageWizard).
   */
  async shouldBeOpened(): Promise<void> {
    await this.name.shouldBeVisible();
  }

  /** Expands the accordion that holds the private-registry and image-pull-secret fields. */
  async openAdvancedOptions(): Promise<void> {
    await this.advancedOptionsToggle.click();
    await this.imagePullSecretName.shouldBeVisible();
  }

  /**
   * Registers the cluster and waits for the create call to answer 2xx, which is the signal
   * the Install Agent dialog is about to open (the sidebar opens it automatically on success).
   */
  async register(name: string): Promise<void> {
    await test.step(`Register cluster "${name}"`, async () => {
      await this.name.fill(name);

      const response = this.page.waitForResponse(
        result =>
          new URL(result.url()).pathname === `/${CcApiRoutes.KUBECLUSTERS}` &&
          result.request().method() === 'POST',
      );
      await this.submit.click();
      await assertResponseOk(await response, `Register cluster "${name}"`);
    });
  }
}
