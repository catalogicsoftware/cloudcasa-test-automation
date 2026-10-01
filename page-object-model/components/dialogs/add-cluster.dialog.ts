import { Page, Response, test } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Checkbox } from '@page-factory/checkbox';
import { Input } from '@page-factory/input';
import { CcApiRoutes } from '@data/api-routes';
import { assertResponseOk } from '@utils/generic';

const SIDEBAR = 'app-cluster-sidebar';

/**
 * The Add Cluster / Edit Cluster side panel (same component, before and after registration).
 * A plain `input[id*="input_name"]` also matches the clusters table's own Name filter, which
 * sits outside this element, so every field locator is scoped to the sidebar.
 */
export class AddClusterDialog {
  readonly name: Input;
  readonly description: Input;
  readonly tags: Input;
  readonly enableDr: Checkbox;
  readonly register: Button;
  readonly cancel: Button;
  readonly close: Button;

  constructor(protected readonly page: Page) {
    // The host element only wraps a fixed-position panel, so it measures 0x0 and never counts
    // as visible — the Name field is the reliable open signal.
    this.name = new Input({
      page,
      locator: `${SIDEBAR} input[id*="input_name"]:visible`,
      name: 'Name',
    });
    this.description = new Input({
      page,
      locator: `${SIDEBAR} input[id*="input_description"]:visible`,
      name: 'Description',
    });
    this.tags = new Input({
      page,
      locator: `${SIDEBAR} input[placeholder="key:value"]`,
      name: 'Add tags',
    });
    this.enableDr = new Checkbox({
      page,
      // Formly numbers the field id prefix per form instance, hence the stable suffix match.
      locator: `${SIDEBAR} input[id*="toggle_features.storage_based_volume_replicas_restore"]`,
      name: 'Enable CloudCasa DR',
    });
    this.register = new Button({
      page,
      locator: `${SIDEBAR} button:has-text("Register")`,
      name: 'Register',
    });
    this.cancel = new Button({
      page,
      locator: `${SIDEBAR} button:text-is("Cancel")`,
      name: 'Cancel',
    });
    this.close = new Button({
      page,
      locator: `${SIDEBAR} .sidebar-header button:has-text("✕")`,
      name: 'Close panel',
    });
  }

  /** Registered before the click; the create call answers once the backend accepts the cluster. */
  async create(): Promise<void> {
    await test.step('Register the cluster', async () => {
      const response = this.waitForCreateResponse();
      await this.register.click();
      await assertResponseOk(await response, 'Create cluster');
    });
  }

  private waitForCreateResponse(): Promise<Response> {
    return this.page.waitForResponse(
      result => this.isKubeClustersUrl(result.url()) && result.request().method() === 'POST',
    );
  }

  private readonly isKubeClustersUrl = (url: string): boolean =>
    new URL(url).pathname === `/${CcApiRoutes.KUBECLUSTERS}`;
}
