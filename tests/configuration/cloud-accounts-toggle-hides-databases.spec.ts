import { expect, test } from '@fixtures/auth';
import { CLOUD_ACCOUNTS_TOGGLE_TEST_TIMEOUT, NAVIGATION_TIMEOUT } from '@data/timeouts';

test.describe('Configuration', () => {
  test.describe.configure({ timeout: CLOUD_ACCOUNTS_TOGGLE_TEST_TIMEOUT });

  test('Turning off cloud accounts hides Databases and the Cloud providers widget', async ({
    cloudAccountsEnabled,
    loggedInPage,
    dashboardPage,
    configurationPage,
    preferencesConfigurationPage,
  }) => {
    const { topNavigationBar: topNav } = dashboardPage;
    const cloudAccountsMenuItem = configurationPage.configurationSideBar.navItem('Cloud accounts');

    // 1. Log in as the admin user. Close the help modal.
    await dashboardPage.userHelpModal.closeModal();

    // 2. Make sure that the dashboard shows the widget "Cloud providers" and that the top navigation shows "Databases".
    await dashboardPage.cloudProvidersCard.shouldBeVisible();
    await topNav.databasesLink.shouldBeVisible();

    // 3. Open /configuration/preferences. Switch "Enable cloud accounts" off. Click "Save".
    await preferencesConfigurationPage.goto('/configuration/preferences');
    await preferencesConfigurationPage.preferencesContainer.shouldBeVisible({}, NAVIGATION_TIMEOUT);
    await preferencesConfigurationPage.enableCloudAccounts.shouldBeChecked();
    await preferencesConfigurationPage.enableCloudAccounts.uncheck();
    await preferencesConfigurationPage.save();

    // 4. Open the dashboard. Make sure that the widget "Cloud providers" and the item "Databases" are not there.
    await dashboardPage.goto('/dashboard');
    await dashboardPage.userHelpModal.closeIfVisible();
    await dashboardPage.clustersCard.shouldBeVisible();
    await expect(dashboardPage.cloudProvidersCard.getLocator()).toBeHidden();
    await topNav.dashboardLink.shouldBeVisible();
    await expect(topNav.databasesLink.getLocator()).toBeHidden();

    // 5. Reload. Make sure that they stay hidden.
    await loggedInPage.reload({ waitUntil: 'load' });
    await dashboardPage.userHelpModal.closeIfVisible();
    await dashboardPage.clustersCard.shouldBeVisible();
    await expect(dashboardPage.cloudProvidersCard.getLocator()).toBeHidden();
    await topNav.dashboardLink.shouldBeVisible();
    await expect(topNav.databasesLink.getLocator()).toBeHidden();

    // 6. Open /configuration/preferences. Switch "Enable cloud accounts" on. Click "Save".
    await preferencesConfigurationPage.goto('/configuration/preferences');
    await preferencesConfigurationPage.preferencesContainer.shouldBeVisible({}, NAVIGATION_TIMEOUT);
    await preferencesConfigurationPage.enableCloudAccounts.shouldNotBeChecked();
    await preferencesConfigurationPage.enableCloudAccounts.check();
    await preferencesConfigurationPage.save();

    // 7. Open the dashboard. Make sure that the widget, the item "Databases" and the Configuration menu item "Cloud accounts" are there again.
    await dashboardPage.goto('/dashboard');
    await dashboardPage.cloudProvidersCard.shouldBeVisible();
    await topNav.databasesLink.shouldBeVisible();
    await topNav.goToConfiguration();
    await configurationPage.shouldOpen();
    await configurationPage.configurationSideBar.navItem('Settings').shouldBeVisible();
    await cloudAccountsMenuItem.shouldBeVisible();

    // 8. Remove uiprefs.disabled_cloudaccounts through the API if a step fails (the cloudAccountsEnabled fixture teardown).
  });
});
