// spec: specs/navigation/navigation.md (TC-NAV-002, TC-AUTH-001)

import { expect, test } from '@fixtures/auth';

test.describe('Global Navigation & User Menu', () => {
  test('The logout terminates the session', async ({ loggedInPage, dashboardPage, loginPage }) => {
    // 1. Log in as the admin user with the loggedInPage fixture.

    // 2. Close the help modal.
    await dashboardPage.userHelpModal.closeModal();

    // 3. Open the user menu.
    await dashboardPage.userMenu.open();

    // 4. Click "Logout".
    await dashboardPage.userMenu.logout();

    // 5. Make sure that the browser goes to the Sign In page.
    await expect(loggedInPage).toHaveURL(/\/login/);

    // 6. Make sure that the Sign In form is visible.
    await loginPage.emailInput.shouldBeVisible();
    await loginPage.signInButton.shouldBeVisible();

    // 7. Open the dashboard URL with a direct navigation.
    await loggedInPage.goto('/dashboard', { waitUntil: 'load' });

    // 8. Make sure that the application shows the Sign In form again.
    await expect(loggedInPage).toHaveURL(/\/login/);
    await loginPage.emailInput.shouldBeVisible();
    await loginPage.signInButton.shouldBeVisible();

    // 9. Make sure that the page does not show the dashboard content.
    await expect(dashboardPage.dashboardContainer.getLocator()).toBeHidden();
  });
});
