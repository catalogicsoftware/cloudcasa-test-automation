import { expect, Page, test } from '@playwright/test';
import { Container } from '@page-factory/container';
import { Input } from '@page-factory/input';
import { Radio } from '@page-factory/radio';
import { BaseDrawer } from './base.drawer';
import { CLOUD_PROVIDERS, cloudProviderCase } from '@data/cloud-accounts';
import type { CloudProviderType } from '../../../types/data/cloud-accounts';

export class AddCloudAccountDrawer extends BaseDrawer {
  readonly providerType: Radio;
  readonly accountName: Input;
  readonly linkingHint: Container;

  constructor(page: Page) {
    super(page, 'app-cloud-account-sidebar', 'Add Cloud Account', 'Register');

    this.providerType = new Radio({
      page,
      locator: this.scoped('input[id*="radio_provider_type"]'),
      name: 'Provider type',
    });
    this.accountName = new Input({
      page,
      locator: this.scoped('input[id*="input_name"]:visible'),
      name: 'Name',
    });
    this.linkingHint = new Container({
      page,
      locator: this.scoped('.alert-info'),
      name: 'Linking process hint',
    });
  }

  /**
   * The host element only wraps a fixed-position panel, so it measures 0x0 and
   * never counts as visible — the footer Cancel button is the reliable open signal
   * (see AddObjectStorageWizard.shouldBeOpened for the same issue).
   */
  async shouldBeOpened(): Promise<void> {
    await this.cancel.shouldBeVisible();
  }

  async shouldOfferEveryProvider(): Promise<void> {
    await test.step('Add Cloud Account dialog should offer AWS, Azure and GCP', async () => {
      for (const provider of CLOUD_PROVIDERS) {
        await expect(this.page.locator(this.scoped('label'), { hasText: provider.label })).toBeVisible();
      }
    });
  }

  /** Switching the provider re-renders the linking hint — the only part of this form that differs per provider. */
  async selectProvider(type: CloudProviderType): Promise<void> {
    await test.step(`Select the provider "${type}"`, async () => {
      await this.providerType.select({ value: type });
      await this.accountName.shouldBeVisible();
    });
  }

  async shouldShowFieldsOf(type: CloudProviderType): Promise<void> {
    const provider = cloudProviderCase(type);

    await test.step(`Dialog should show the ${provider.label} fields`, async () => {
      await this.accountName.shouldBeVisible();
      await this.linkingHint.shouldHaveText(provider.linkingHint);
    });
  }
}
