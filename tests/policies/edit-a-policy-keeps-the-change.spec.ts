import { expect, test } from '@fixtures/auth';
import { dailyCron, expectedRetention, expectedRule, scheduleCases } from '@data/policies';
import { BACKEND_PROBE_TIMEOUT, POLICY_TEST_TIMEOUT } from '@data/timeouts';
import { testResourceName, testResourceNamePattern } from '@utils/resource-names';
import type { DailySchedule } from '../../types/data/policy';

test.describe('Policies', () => {
  test.describe.configure({ timeout: POLICY_TEST_TIMEOUT });

  test('The user changes a policy and the change stays', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    policiesConfigurationPage,
    ccApi,
    toast,
    createdPolicies,
  }) => {
    // Two independent Daily cases so only the time (and whatever else is random with it)
    // actually changes between the seeded policy and the edit — the frequency stays Daily.
    const initialSchedule = scheduleCases().find(
      (s): s is DailySchedule => s.frequency === 'Daily',
    )!;
    const updatedSchedule = scheduleCases().find(
      (s): s is DailySchedule => s.frequency === 'Daily',
    )!;

    // Make one daily policy through the API. Use testResourceName('policy') for the name.
    const name = testResourceName('policy');
    const namePattern = testResourceNamePattern(name);
    const policy = await ccApi.policies.create(
      name,
      dailyCron(initialSchedule),
      initialSchedule.retentionDays,
    );

    // Push the name to the fixture createdPolicies
    createdPolicies.push(name);

    // Log in as the admin user and open /configuration/policies
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.topNavigationBar.goToConfiguration();
    await configurationPage.configurationSideBar.goTo('Policies');
    await policiesConfigurationPage.shouldOpen();

    // Make sure that the table holds the policy with its first values
    await policiesConfigurationPage.shouldListPolicy(namePattern, initialSchedule, policy.timezone);

    // Open the edit action of that row
    const dialog = await policiesConfigurationPage.openEditPolicyDialog(namePattern);
    await dialog.shouldBeOpened();

    // Change the timezone to a different value
    const newTimezone = await dialog.selectRandomTimezone(policy.timezone);

    // Change the time of the schedule
    await dialog.removeSchedule(expectedRule(initialSchedule));
    await expect(dialog.scheduleItem(expectedRule(initialSchedule))).toHaveCount(0);
    await dialog.addSchedule(updatedSchedule);

    // Save the dialog
    await dialog.save();
    await expect(dialog.dialog.getLocator()).toHaveCount(0);

    // Make sure that a success toast appears
    await expect(toast.notifications.getLocator(), {
      message: 'No success notification matching /Updated policy/i appeared',
    }).toContainText(/Updated policy/i, { timeout: BACKEND_PROBE_TIMEOUT });

    // Make sure that the columns Schedules and Timezone show the new values
    await policiesConfigurationPage.shouldListPolicy(namePattern, updatedSchedule, newTimezone);

    // Reload the page
    await loggedInPage.reload({ waitUntil: 'load' });
    await policiesConfigurationPage.shouldOpen();

    // Make sure that the new values stay
    await policiesConfigurationPage.shouldListPolicy(namePattern, updatedSchedule, newTimezone);

    // Open the edit action again
    const reopenedDialog = await policiesConfigurationPage.openEditPolicyDialog(namePattern);
    await reopenedDialog.shouldBeOpened();

    // Make sure that the dialog shows the new values in its fields
    expect(await reopenedDialog.defaultTimezone()).toBe(newTimezone);
    const scheduleText = await reopenedDialog.currentScheduleText();
    expect(scheduleText).toContain(expectedRule(updatedSchedule));
    expect(scheduleText).toContain(expectedRetention(updatedSchedule));

    // Close the dialog
    await reopenedDialog.cancel.click();
    await expect(reopenedDialog.dialog.getLocator()).toHaveCount(0);
  });
});
