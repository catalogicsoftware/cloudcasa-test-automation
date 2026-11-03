import { expect, test } from '@fixtures/auth';
import { CLOUD_ACCOUNTS_TOGGLE_TEST_TIMEOUT, NAVIGATION_TIMEOUT } from '@data/timeouts';

test.describe('Configuration', () => {
  test.describe.configure({ timeout: CLOUD_ACCOUNTS_TOGGLE_TEST_TIMEOUT });

  test('Turning off cloud accounts hides Cloud accounts in the Configuration menu', async ({
    cloudAccountsEnabled,
    loggedInPage,
    dashboardPage,
    configurationPage,
    preferencesConfigurationPage,
  }) => {
    const { topNavigationBar: topNav } = dashboardPage;
    const settingsMenuItem = configurationPage.configurationSideBar.navItem('Settings');
    const cloudAccountsMenuItem = configurationPage.configurationSideBar.navItem('Cloud accounts');

    // 1. Log in as the admin user. Close the help modal.
    await dashboardPage.userHelpModal.closeModal();

    // 2. Open the Configuration menu. Make sure that it shows "Cloud accounts".
    await topNav.goToConfiguration();
    await configurationPage.shouldOpen();
    await settingsMenuItem.shouldBeVisible();
    await cloudAccountsMenuItem.shouldBeVisible();

    // 3. Open /configuration/preferences. Switch "Enable cloud accounts" off. Click "Save".
    await preferencesConfigurationPage.goto('/configuration/preferences');
    await preferencesConfigurationPage.preferencesContainer.shouldBeVisible({}, NAVIGATION_TIMEOUT);
    await preferencesConfigurationPage.enableCloudAccounts.shouldBeChecked();
    await preferencesConfigurationPage.enableCloudAccounts.uncheck();
    await preferencesConfigurationPage.save();

    // 4. Open the Configuration menu. Make sure that "Cloud accounts" is not there.
    await topNav.goToConfiguration();
    await configurationPage.shouldOpen();
    await settingsMenuItem.shouldBeVisible();
    // Defect: actual — "Cloud accounts" stays in the Configuration menu with the toggle off; expected — the menu hides it like "Databases".
    test.fixme();
    await expect(cloudAccountsMenuItem.getLocator()).toBeHidden();

    // 5. Reload. Make sure that "Cloud accounts" stays hidden.
    await loggedInPage.reload({ waitUntil: 'load' });
    await dashboardPage.userHelpModal.closeIfVisible();
    await settingsMenuItem.shouldBeVisible();
    await expect(cloudAccountsMenuItem.getLocator()).toBeHidden();

    // 6. Remove uiprefs.disabled_cloudaccounts through the API (the cloudAccountsEnabled fixture teardown).
  });
});
