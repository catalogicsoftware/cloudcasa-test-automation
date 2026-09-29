import { BasePage } from '@page-object-model/pages/base.page';
import { expect, Locator, Page, test } from '@playwright/test';
import { Container } from '@page-factory/container';

export class PricingPlansPage extends BasePage {
  readonly planCards: Container = new Container({
    page: this.page,
    locator: '.card-deck',
    name: 'Plan Cards',
  });

  constructor(page: Page) {
    super(page);
  }

  async shouldOpen(): Promise<void> {
    await test.step('Pricing plans page should be opened', async () => {
      await expect(this.page).toHaveURL(/\/configuration\/pricing-plans/);
      await this.planCards.shouldBeVisible();
    });
  }

  // Cards render no upgrade/contact button for the plan the organization is already on.
  // Filtered by the card title, not the whole card text: a paid plan's own feature list
  // includes the line "All free plan features", which would otherwise also match "free".
  getPlanCard(planName: string | RegExp): Locator {
    return this.planCards
      .getLocator()
      .locator('.card')
      .filter({ has: this.page.locator('.card-title', { hasText: planName }) });
  }
}
