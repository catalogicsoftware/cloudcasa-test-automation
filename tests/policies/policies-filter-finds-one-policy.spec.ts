import { test } from '@fixtures/auth';
import { testResourceName } from '@utils/resource-names';
import { POLICY_LIST_RELOAD_TIMEOUT, POLICY_TEST_TIMEOUT } from '@data/timeouts';

/** Rule 14: a generated name is matched as an escaped regex, not a plain (substring) string. */
const nameLocator = (name: string): RegExp =>
  new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

test.describe('Policies', () => {
  test.describe.configure({ timeout: POLICY_TEST_TIMEOUT });

  test('The policies filter finds one policy of many', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    policiesConfigurationPage,
    ccApi,
    createdPolicies,
  }) => {
    // Make three policies through the API
    const policyNames: string[] = [];
    for (let i = 0; i < 3; i++) {
      const name = testResourceName('policy');
      await ccApi.policies.create(name);
      createdPolicies.push(name);
      policyNames.push(name);
    }

    // Log in as the admin user and open /configuration/policies
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.topNavigationBar.goToConfiguration();
    await configurationPage.configurationSideBar.goTo('Policies');
    await policiesConfigurationPage.shouldOpen();

    // Click "Add policy"
    const dialog = await policiesConfigurationPage.openAddPolicyDialog();

    // Keep the name field empty: the save button stays off
    await dialog.createPolicy.shouldBeDisabled();

    // Click "Cancel"
    await dialog.cancel.click();

    // The table holds the three policies made in step 1
    for (const name of policyNames) {
      await policiesConfigurationPage.policiesTable.shouldHaveRow(
        nameLocator(name),
        POLICY_LIST_RELOAD_TIMEOUT,
      );
    }

    // Type the name of the first policy in the filter
    await policiesConfigurationPage.filterByName(policyNames[0]);

    // The table shows that policy only
    await policiesConfigurationPage.policiesTable.shouldHaveRowCount(1, POLICY_LIST_RELOAD_TIMEOUT);
    await policiesConfigurationPage.policiesTable.shouldHaveRow(nameLocator(policyNames[0]));

    // Type a string that no policy uses
    await policiesConfigurationPage.filterByName(testResourceName('no-such-policy'));

    // The table shows the empty state
    await policiesConfigurationPage.emptyState.shouldBeVisible();

    // Clear the filter
    await policiesConfigurationPage.filterByName('');

    // The three policies come back
    for (const name of policyNames) {
      await policiesConfigurationPage.policiesTable.shouldHaveRow(
        nameLocator(name),
        POLICY_LIST_RELOAD_TIMEOUT,
      );
    }
  });
});
