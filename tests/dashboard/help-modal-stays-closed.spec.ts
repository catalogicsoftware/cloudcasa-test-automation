import { expect, test } from '@fixtures/auth';
import { LOGIN_REDIRECT_TIMEOUT } from '@data/timeouts';

test.describe('Dashboard', () => {
  test('The help modal stays closed after the user dismisses it', async ({
    loggedInPage,
    dashboardPage,
    loginPage,
    adminUser,
    resetHelpDialogPreference,
  }) => {
    // 1. Log in as the admin user.

    // 2. Make sure that the help modal is visible.
    await dashboardPage.userHelpModal.container.shouldBeVisible();

    // 3. Select "Please do not show this popup again".
    await dashboardPage.userHelpModal.selectDoNotShowAgain();

    // 4. Confirm the selection.
    await dashboardPage.userHelpModal.confirm();

    // 5. Make sure that the help modal closes and the dashboard is available.
    await expect(dashboardPage.userHelpModal.container.getLocator()).toBeHidden();
    await dashboardPage.dashboardContainer.shouldBeVisible();

    // 6. Log out from the application.
    await dashboardPage.userMenu.open();
    await dashboardPage.userMenu.logout();

    // 7. Log in again with the same account.
    await loginPage.goto();
    await loginPage.login(adminUser.email, adminUser.password);
    await loggedInPage.waitForURL('**/dashboard**', { timeout: LOGIN_REDIRECT_TIMEOUT });

    // 8. Make sure that the help modal stays closed and the dashboard is available.
    await expect(dashboardPage.userHelpModal.container.getLocator()).toBeHidden();
    await dashboardPage.dashboardContainer.shouldBeVisible();
  });
});
