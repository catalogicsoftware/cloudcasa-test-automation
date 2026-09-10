import { expect, test } from '@fixtures/auth';
import { scheduleCases } from '@data/policies';
import { POLICY_TEST_TIMEOUT } from '@data/timeouts';
import { testResourceName } from '@utils/resource-names';

test.describe('Policies', () => {
  test.describe.configure({ timeout: POLICY_TEST_TIMEOUT });

  for (const schedule of scheduleCases()) {
    test(`Create a policy with a ${schedule.label} schedule`, async ({
      loggedInPage,
      dashboardPage,
      configurationPage,
      policiesConfigurationPage,
      createdPolicies,
    }) => {
      const name = testResourceName(`policy-${schedule.label}`);

      // Log in and navigate to /configuration/policies
      await dashboardPage.userHelpModal.closeModal();
      await dashboardPage.topNavigationBar.goToConfiguration();
      await configurationPage.configurationSideBar.goTo('Policies');
      await policiesConfigurationPage.shouldOpen();

      // Open "Add policy": the name is required and the dialog opens with a timezone already picked
      const dialog = await policiesConfigurationPage.openAddPolicyDialog();
      await dialog.policyName.fill(name, { validateValue: true });
      expect(await dialog.defaultTimezone()).not.toBe('');

      // Hourly is out of reach on the free plan, and the dialog says so by disabling it
      await dialog.hourly.shouldBeDisabled();

      // A policy is not creatable until it has at least one schedule
      await dialog.createPolicy.shouldBeDisabled();

      const timezone = await dialog.selectRandomTimezone();
      await dialog.addSchedule(schedule);
      await dialog.createPolicy.shouldBeEnabled();

      // Registered before the save so teardown owns the policy even if a later assertion fails
      createdPolicies.push(name);
      await dialog.create();

      // The policy is listed with the schedule that was just built
      await policiesConfigurationPage.shouldListPolicy(name, schedule, timezone);

      // It is persisted, not just appended to the client-side list
      await loggedInPage.reload({ waitUntil: 'load' });
      await policiesConfigurationPage.shouldOpen();
      await policiesConfigurationPage.shouldListPolicy(name, schedule, timezone);

      // Removing it takes a confirmation, and leaves no orphan row
      await policiesConfigurationPage.removePolicy(name);
      await loggedInPage.reload({ waitUntil: 'load' });
      await policiesConfigurationPage.shouldOpen();
      await policiesConfigurationPage.policiesTable.shouldNotHaveRow(name);
    });
  }

  // Actual: "Add to schedule" does nothing for Custom — the cron field is ng-valid, the
  // button is enabled, and no schedule is added, so Create policy stays disabled.
  // Expected: the cron builds a schedule like every other frequency.
  // eslint-disable-next-line playwright/expect-expect
  test.fixme('Create a policy with a custom cron schedule', () => {});
});
