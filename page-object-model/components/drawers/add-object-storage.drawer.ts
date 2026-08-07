import { expect, Page, test } from '@playwright/test';
import { Button } from '@page-fatory/button';
import { Checkbox } from '@page-fatory/checkbox';
import { Dropdown } from '@page-fatory/dropdown';
import { Input } from '@page-fatory/input';
import { BaseDrawer } from './base.drawer';
import { CcApiRoutes } from '@data/api-routes';
import type { S3StorageTarget } from '../../../types/data/storage';

/**
 * "Add object storage" sidebar wizard: General -> Provider -> Summary.
 *
 * Formly regenerates the numeric id prefix on every render (formly_33_input_...),
 * so fields are matched on the stable id suffix. Hidden provider branches
 * (Azure, Google) keep their inputs in the DOM with the same suffixes, hence
 * the `:visible` filter on every field.
 */
export class AddObjectStorageWizard extends BaseDrawer {
  readonly next: Button;
  readonly back: Button;
  readonly dismiss: Button;
  readonly summaryTab: Button;
  readonly bucketName: Input;
  readonly endpointUrl: Input;
  readonly region: Input;
  readonly regionSelect: Dropdown;
  readonly accessKey: Input;
  readonly secretKey: Input;
  readonly disableTlsValidation: Checkbox;
  readonly storageName: Input;

  constructor(page: Page) {
    super(page, 'app-storage-sidebar', 'Add object storage', 'Save');

    this.next = new Button({ page, locator: this.scoped('button:has-text("Next")'), name: 'Next' });
    this.back = new Button({ page, locator: this.scoped('button:has-text("Back")'), name: 'Back' });
    // Cancel only exists on the General step; the ✕ closes the wizard from any step.
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
    // AWS endpoints swap the free-text Region for a mandatory filtered select.
    this.regionSelect = new Dropdown({
      page,
      locator: this.scoped('app-input-select-filter button.mat-menu-trigger:visible'),
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

  /** Region is only filled when the case provides one — see S3StorageTarget.region. */
  async fillProvider(storage: S3StorageTarget): Promise<void> {
    await test.step('Fill the S3 provider fields', async () => {
      await this.bucketName.fill(storage.bucket);
      await this.endpointUrl.fill(storage.endpoint);
      await this.accessKey.fill(storage.accessKey);
      await this.secretKey.fill(storage.secretKey);
      if (storage.region) {
        await this.regionSelect.selectByText(storage.region);
      }
    });
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

  /**
   * Save with inputs the backend will reject and return its HTTP status. The
   * repo's clickAndWaitForResponse helper asserts a 2xx, which is exactly what
   * must not happen here, so the response is awaited directly — and awaiting it
   * (instead of the toast) is what proves the request was actually sent.
   */
  async saveExpectingRejection(name: string): Promise<number> {
    return test.step(`Save storage "${name}" expecting the backend to reject it`, async () => {
      await this.storageName.fill(name);
      await this.submit.shouldBeEnabled();

      const objectStores = `/${CcApiRoutes.OBJECT_STORES}`;
      const response = this.page.waitForResponse(
        result =>
          new URL(result.url()).pathname === objectStores && result.request().method() === 'POST',
        { timeout: 150000 },
      );
      await this.submit.click();
      return (await response).status();
    });
  }
}
