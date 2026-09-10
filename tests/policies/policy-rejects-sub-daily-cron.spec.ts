import { expect, test } from '@fixtures/auth';
import { FREE_PLAN_CRON_ERROR, SUB_DAILY_CRON } from '@data/policies';
import { POLICY_TEST_TIMEOUT } from '@data/timeouts';
import { testResourceName } from '@utils/resource-names';

const RETENTION_DAYS = 7;

test.describe('Policies', () => {
  test.describe.configure({ timeout: POLICY_TEST_TIMEOUT });

  test('Create a policy rejects a cron more frequent than daily on a free account', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    policiesConfigurationPage,
    toast,
    createdPolicies,
  }) => {
    // Log in and navigate to /configuration/policies
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.topNavigationBar.goToConfiguration();
    await configurationPage.configurationSideBar.goTo('Policies');
    await policiesConfigurationPage.shouldOpen();

    // Open "Add policy" and name the policy
    const name = testResourceName('sub-daily-cron');
    const dialog = await policiesConfigurationPage.openAddPolicyDialog();
    await dialog.policyName.fill(name, { validateValue: true });

    // Sub-daily protection is out of reach on the free plan, and the dialog says so by disabling Hourly
    await dialog.hourly.shouldBeDisabled();

    // The cron field enforces none of that: a half-hourly expression is accepted and builds a schedule
    createdPolicies.push(name);
    await dialog.addCronSchedule(SUB_DAILY_CRON, RETENTION_DAYS);

    // Only the backend refuses it, and it names the plan instead of a generic error
    const status = await dialog.createExpectingRejection();
    expect(status, 'the backend must refuse a sub-daily schedule on a free account').toBe(422);
    await toast.shouldShowError(FREE_PLAN_CRON_ERROR);

    // The failure is recoverable: the dialog stays open with the schedule still on it
    await dialog.shouldBeOpened();
    await dialog.createPolicy.shouldBeEnabled();

    // A refused policy must not leave a row behind
    await dialog.cancel.click();
    await loggedInPage.reload({ waitUntil: 'load' });
    await policiesConfigurationPage.shouldOpen();
    await policiesConfigurationPage.policiesTable.shouldNotHaveRow(name);
  });
});
