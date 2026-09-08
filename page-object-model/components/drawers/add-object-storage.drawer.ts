import { expect, Page, Response, test } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Checkbox } from '@page-factory/checkbox';
import { Dropdown } from '@page-factory/dropdown';
import { Radio } from '@page-factory/radio';
import { Input } from '@page-factory/input';
import { BaseDrawer } from './base.drawer';
import { CcApiRoutes } from '@data/api-routes';
import { BACKEND_PROBE_TIMEOUT, WIDGET_SWAP_TIMEOUT } from '@data/timeouts';
import { listedAs } from '@data/storage';
import { assertResponseOk } from '@utils/generic';
import type {
  AzureStorageTarget,
  ProviderType,
  S3StorageTarget,
  StorageTarget,
} from '../../../types/data/storage';

export class AddObjectStorageWizard extends BaseDrawer {
  readonly next: Button;
  readonly providerType: Radio;
  readonly back: Button;
  readonly dismiss: Button;
  readonly summaryTab: Button;
  readonly bucketName: Input;
  readonly endpointUrl: Input;
  readonly region: Input;
  readonly regionSelect: Dropdown;
  readonly accessKey: Input;
  readonly secretKey: Input;
  readonly azureCloud: Radio;
  readonly authenticationMethod: Radio;
  readonly resourceGroup: Input;
  readonly storageAccountName: Input;
  readonly subscriptionId: Input;
  readonly tenantId: Input;
  readonly clientId: Input;
  readonly clientSecret: Input;
  readonly disableTlsValidation: Checkbox;
  readonly storageName: Input;

  constructor(page: Page) {
    super(page, 'app-storage-sidebar', 'Add object storage', 'Save');

    this.next = new Button({ page, locator: this.scoped('button:has-text("Next")'), name: 'Next' });
    this.back = new Button({ page, locator: this.scoped('button:has-text("Back")'), name: 'Back' });

    this.dismiss = new Button({
      page,
      locator: this.scoped('button:has-text("✕")'),
      name: 'Close wizard',
    });
    this.summaryTab = new Button({
      page,
      locator: this.scoped('button:has-text("Summary")'),
      name: 'Summary',
    });
    this.providerType = new Radio({
      page,
      // Formly regenerates the numeric id prefix on every render, hence the stable suffix match.
      locator: this.scoped('input[id*="radio_provider_type"]'),
      name: 'Provider type',
    });
    this.bucketName = new Input({
      page,
      locator: this.scoped('input[id*="input_bucket_name"]:visible'),
      name: 'Bucket name',
    });
    this.endpointUrl = new Input({
      page,
      locator: this.scoped('input[id*="s3provider.endpoint"]:visible'),
      name: 'Endpoint URL',
    });
    this.region = new Input({
      page,
      locator: this.scoped('input[id*="input_region"]:visible'),
      name: 'Region',
    });

    this.regionSelect = new Dropdown({
      page,
      // Anchored on the label: the Azure step renders a second select-filter (Backup repo granularity).
      locator: this.scoped(
        '.form-group:has(label[for*="select-filter_region"]) button.mat-menu-trigger:visible',
      ),
      name: 'Region',
    });
    this.accessKey = new Input({
      page,
      locator: this.scoped('input[id*="credentials.access_key"]:visible'),
      name: 'Access key',
    });
    this.secretKey = new Input({
      page,
      locator: this.scoped('input[id*="credentials.secret_key"]:visible'),
      name: 'Secret key',
    });
    this.azureCloud = new Radio({
      page,
      locator: this.scoped('input[id*="radio_s3provider.cloud"]'),
      name: 'Azure cloud',
    });
    this.authenticationMethod = new Radio({
      page,
      locator: this.scoped('input[id*="radio__authenticationMethod"]'),
      name: 'Authentication method',
    });
    this.resourceGroup = new Input({
      page,
      locator: this.scoped('input[id*="resource_group_name"]:visible'),
      name: 'Resource group name',
    });
    this.storageAccountName = new Input({
      page,
      locator: this.scoped('input[id*="storage_account_name"]:visible'),
      name: 'Storage account name',
    });
    this.subscriptionId = new Input({
      page,
      locator: this.scoped('input[id*="credentials.subscription_id"]:visible'),
      name: 'Subscription ID',
    });
    this.tenantId = new Input({
      page,
      locator: this.scoped('input[id*="credentials.tenant_id"]:visible'),
      name: 'Tenant ID',
    });
    this.clientId = new Input({
      page,
      locator: this.scoped('input[id*="credentials.client_id"]:visible'),
      name: 'Client ID',
    });
    this.clientSecret = new Input({
      page,
      locator: this.scoped('input[id*="credentials.client_secret"]:visible'),
      name: 'Client secret',
    });
    this.disableTlsValidation = new Checkbox({
      page,
      locator: this.scoped('input[id*="skip_tls_certificate_validation"]:visible'),
      name: 'Disable TLS certificate validation',
    });
    this.storageName = new Input({
      page,
      locator: this.scoped('input[id*="input_name"]:visible'),
      name: 'Name',
    });
  }

  /**
   * The host element only wraps a fixed-position panel, so it measures 0x0 and
   * never counts as visible — the footer button is the reliable open signal.
   */
  async shouldBeOpened(): Promise<void> {
    await this.next.shouldBeVisible();
  }

  async close(): Promise<void> {
    await this.dismiss.click();
    await expect(this.page.locator(this.scoped('button:has-text("Next")'))).toHaveCount(0);
  }

  async shouldHaveWizardSteps(): Promise<void> {
    await test.step('Wizard should show the General / Provider / Summary steps', async () => {
      for (const step of ['General', 'Provider', 'Summary']) {
        await expect(this.page.locator(this.scoped(`button:has-text("${step}")`))).toBeVisible();
      }
      // Summary is reachable only once the provider form validates.
      await this.summaryTab.shouldBeDisabled();
    });
  }

  async goToProviderStep(): Promise<void> {
    await test.step('Go to the Provider step', async () => {
      await this.next.click();
      await this.bucketName.shouldBeVisible();
    });
  }

  /** The provider is always selected explicitly rather than trusting the form's preselection. */
  async fillProvider(target: StorageTarget): Promise<void> {
    await test.step(`Fill the ${target.provider} provider fields`, async () => {
      await this.selectProviderType(target.provider);

      if (target.provider === 'azure') {
        await this.fillAzureFields(target);
      } else {
        await this.fillS3Fields(target);
      }
    });
  }

  /** Switching the provider type re-renders the whole field set (TC-STG-007). */
  async selectProviderType(providerType: ProviderType): Promise<void> {
    await this.providerType.select({ value: providerType });
  }

  /** Region is only filled when the case provides one — see S3StorageTarget.region. */
  private async fillS3Fields(storage: S3StorageTarget): Promise<void> {
    await this.bucketName.fill(storage.bucket);
    await this.endpointUrl.fill(storage.endpoint);
    await this.accessKey.fill(storage.accessKey, { secret: true });
    await this.secretKey.fill(storage.secretKey, { secret: true });
    if (storage.region) {
      await this.fillRegion(storage.region);
    }
  }

  /** Only AWS endpoints turn Region into a select — every other S3 target types it as free text. */
  private async fillRegion(region: string): Promise<void> {
    const select = this.regionSelect.getLocator();
    const freeText = this.region.getLocator();
    await expect(select.or(freeText).first()).toBeVisible();

    // The endpoint decides which widget renders, so the select gets a moment to replace the input Angular is still showing.
    const rendered = await select
      .waitFor({ state: 'visible', timeout: WIDGET_SWAP_TIMEOUT })
      .then(() => true)
      .catch(() => false);

    if (rendered) {
      // The select is single-select and dismisses its own menu, so there is no footer "close" to click.
      await this.regionSelect.selectByText(region, { keepOpen: true });
    } else {
      await this.region.fill(region);
    }
  }

  /** Azure names a storage account inside a resource group and authenticates only with a service principal. */
  private async fillAzureFields(storage: AzureStorageTarget): Promise<void> {
    if (storage.cloud) {
      await this.azureCloud.select({ value: storage.cloud });
    }
    await this.resourceGroup.fill(storage.resourceGroup);
    await this.storageAccountName.fill(storage.storageAccount);
    await this.fillRegion(storage.region);
    // Chosen before its fields are filled: picking a method re-renders the credential sub-form.
    await this.authenticationMethod.select({ value: '_azure_principal' });
    // Hidden from reports for the reason they are not in the catalog: they identify the account.
    await this.subscriptionId.fill(storage.subscriptionId, { secret: true });
    await this.tenantId.fill(storage.tenantId, { secret: true });
    await this.clientId.fill(storage.clientId, { secret: true });
    await this.clientSecret.fill(storage.clientSecret, { secret: true });
  }

  /**
   * The S3 ecosystem writes endpoints in many shapes and the GUI must not
   * reject any of them client-side (CC-659→663). Enabled "Next" is the signal
   * that the form accepted the value.
   */
  async shouldAcceptEndpoint(endpoint: string): Promise<void> {
    await test.step(`Provider step should accept endpoint "${endpoint}"`, async () => {
      await this.endpointUrl.fill(endpoint);
      await this.next.shouldBeEnabled();
    });
  }

  async goToSummaryStep(): Promise<void> {
    await test.step('Go to the Summary step', async () => {
      await this.next.shouldBeEnabled();
      await this.next.click();
      await this.storageName.shouldBeVisible();
    });
  }

  async shouldSummarizeEndpoint(endpoint: string): Promise<void> {
    await test.step(`Summary should show endpoint "${endpoint}"`, async () => {
      await expect(this.container.getLocator()).toContainText(endpoint);
    });
  }

  /** Everything typed on the Provider step must survive to the Summary — except the credentials, which are never echoed. */
  async shouldSummarizeTarget(target: StorageTarget): Promise<void> {
    const { region } = listedAs(target);

    await this.shouldSummarize(
      target.provider === 'azure'
        ? [target.resourceGroup, target.storageAccount, region]
        : [target.bucket, target.endpoint, region],
    );
  }

  private async shouldSummarize(values: (string | undefined)[]): Promise<void> {
    await test.step('Summary should echo the provider details', async () => {
      const summary = this.container.getLocator();
      for (const value of values.filter(Boolean)) {
        await expect(summary).toContainText(value as string);
      }
    });
  }

  /**
   * Saves and waits for the create call to answer 2xx, which is the backend
   * reporting it reached the bucket. A vanished footer is the signal it closed.
   */
  async save(name: string): Promise<void> {
    await test.step(`Save storage "${name}"`, async () => {
      await this.storageName.fill(name);
      await this.submit.shouldBeEnabled();

      const response = this.waitForCreateResponse();
      await this.submit.click();
      await assertResponseOk(await response, `Create storage "${name}"`);

      await expect(this.page.locator(this.scoped('button:has-text("Next")'))).toHaveCount(0);
    });
  }

  /**
   * Save with inputs the backend will reject and return its HTTP status.
   * Awaiting the response (instead of the toast) is what proves the request
   * was actually sent.
   */
  async saveExpectingRejection(name: string): Promise<number> {
    return test.step(`Save storage "${name}" expecting the backend to reject it`, async () => {
      await this.storageName.fill(name);
      await this.submit.shouldBeEnabled();

      const response = this.waitForCreateResponse();
      await this.submit.click();
      return (await response).status();
    });
  }

  /** Registered before the click; own wait since a rejection here must not assert 2xx. */
  private waitForCreateResponse(): Promise<Response> {
    return this.page.waitForResponse(
      result => this.isObjectStoresUrl(result.url()) && result.request().method() === 'POST',
      { timeout: BACKEND_PROBE_TIMEOUT },
    );
  }

  private readonly isObjectStoresUrl = (url: string): boolean =>
    new URL(url).pathname === `/${CcApiRoutes.OBJECT_STORES}`;
}
