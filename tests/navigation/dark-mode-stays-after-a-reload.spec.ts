// spec: specs/navigation/navigation.md (TC-NAV-005)

import { expect, test } from '@fixtures/auth';

test.describe('Global Navigation & User Menu', () => {
  test('The dark mode stays on after a reload', async ({
    loggedInPage,
    dashboardPage,
    clustersPage,
  }) => {
    // 1. Log in as the admin user with the loggedInPage fixture.

    // 2. Close the help modal.
    await dashboardPage.userHelpModal.closeModal();

    // 3. Read the theme attribute of the page body.
    const initialThemeClass = await dashboardPage.getThemeClass();
    const wasDarkModeOn = initialThemeClass?.includes('dark-mode') ?? false;

    // 4. Open the user menu.
    await dashboardPage.userMenu.open();

    // 5. Set the switch "Dark mode" to on.
    await dashboardPage.userMenu.setDarkMode(true);

    // 6. Make sure that the theme attribute changes immediately.
    await expect(loggedInPage.locator('body')).toHaveClass(/dark-mode/);

    // 7. Reload the dashboard.
    await dashboardPage.reloadPage();

    // 8. Make sure that the theme attribute keeps the dark value.
    await expect(loggedInPage.locator('body')).toHaveClass(/dark-mode/);

    // 9. Open the clusters page.
    await clustersPage.goto('/clusters');
    await clustersPage.shouldOpen();

    // 10. Make sure that the dark theme is also on that page.
    await expect(loggedInPage.locator('body')).toHaveClass(/dark-mode/);

    // 11. Set the switch "Dark mode" back to the first value.
    await dashboardPage.userHelpModal.closeIfVisible();
    await dashboardPage.userMenu.open();
    await dashboardPage.userMenu.setDarkMode(wasDarkModeOn);
  });
});
