// spec: specs/navigation/navigation.md (TC-NAV-007)

import { expect, test } from '@fixtures/auth';

test.describe('Global Navigation & User Menu', () => {
  test('The plan badge opens the pricing plans', async ({
    loggedInPage,
    dashboardPage,
    pricingPlansPage,
  }) => {
    // 1. Log in as the admin user.

    // 2. Close the help modal.
    await dashboardPage.userHelpModal.closeModal();

    // 3. Make sure that the top bar shows the badge "free".
    await dashboardPage.topNavigationBar.planBadge.shouldHaveText('free');

    // 4. Click the badge.
    await dashboardPage.topNavigationBar.goToPricingPlans();

    // 5. Make sure that the URL is /configuration/pricing-plans.
    await expect(loggedInPage).toHaveURL(/\/configuration\/pricing-plans/);

    // 6. Make sure that the page shows the plan cards.
    await pricingPlansPage.shouldOpen();

    // 7. Make sure that the page marks the free plan as the current plan.
    await expect(pricingPlansPage.getPlanCard(/free/i).locator('button')).toHaveCount(0);
  });
});
