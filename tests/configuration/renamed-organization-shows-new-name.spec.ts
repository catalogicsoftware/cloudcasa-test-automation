import { expect, test } from '@fixtures/auth';
import { testResourceName, testResourceNamePattern } from '@utils/resource-names';
import { ORGANIZATION_RENAME_TEST_TIMEOUT } from '@data/timeouts';

test.describe('Configuration', () => {
  test.describe.configure({ timeout: ORGANIZATION_RENAME_TEST_TIMEOUT });

  test('A renamed organization shows its new name everywhere', async ({
    originalOrganizationName,
    loggedInPage,
    dashboardPage,
    usersConfigurationPage,
    preferencesConfigurationPage,
  }) => {
    const { changeOrganizationNameDialog } = usersConfigurationPage;
    const { userMenu, switchOrganizationDialog } = dashboardPage;

    // 1. Read the display_name of the organization through the API.
    const originalName = originalOrganizationName;

    // 2. Log in as the admin user. Close the help modal.
    await dashboardPage.userHelpModal.closeModal();

    // 3. Open /configuration/users/organization-users. Click the edit icon next to "Name:".
    await usersConfigurationPage.goto('/configuration/users/organization-users');
    await usersConfigurationPage.shouldOpen();
    await usersConfigurationPage.editOrganizationName.click();

    // 4. Make sure that the dialog "Change organization name" opens, empty, with the current name as the placeholder.
    await changeOrganizationNameDialog.dialog.shouldBeVisible();
    await changeOrganizationNameDialog.organizationName.shouldHaveValue('');
    await expect(changeOrganizationNameDialog.organizationName.getLocator()).toHaveAttribute(
      'placeholder',
      originalName,
    );

    // 5. Fill a name made with testResourceName('org'). Click "Change".
    const newName = testResourceName('org');
    const newNamePattern = testResourceNamePattern(newName);
    await changeOrganizationNameDialog.change(newName);
    await expect(changeOrganizationNameDialog.dialog.getLocator()).toBeHidden();

    // 6. Make sure that the line "Name:" shows the new name.
    await expect(usersConfigurationPage.organizationName.getLocator()).toHaveText(newNamePattern);

    // 7. Make sure that the organization button in the top bar shows the new name.
    await expect(userMenu.headerOrganization.getLocator()).toHaveText(newNamePattern);

    // 8. Open the dialog "Select organization" from the user menu, check the new name, click "Cancel".
    await userMenu.open();
    await userMenu.switchOrganization();
    await switchOrganizationDialog.dialog.shouldBeVisible();
    await expect(switchOrganizationDialog.organizationOption(newNamePattern)).toBeChecked();
    await switchOrganizationDialog.cancel();
    await expect(switchOrganizationDialog.dialog.getLocator()).toBeHidden();

    // 9. Open /configuration/preferences. Make sure that "Organization name" holds the new name.
    await preferencesConfigurationPage.goto('/configuration/preferences');
    await expect(loggedInPage).toHaveURL(/\/configuration\/preferences/);
    await preferencesConfigurationPage.preferencesContainer.shouldBeVisible();
    await expect(preferencesConfigurationPage.organizationName.getLocator()).toHaveValue(
      newNamePattern,
    );

    // 10. Reload. Make sure that the new name stays in the top bar.
    await loggedInPage.reload({ waitUntil: 'load' });
    await expect(userMenu.headerOrganization.getLocator()).toHaveText(newNamePattern);

    // 11. Set the first display_name again through the API (the originalOrganizationName fixture teardown).
  });
});
