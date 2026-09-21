// spec: specs/navigation/navigation.md (TC-NAV-008)

import { expect, test } from '@fixtures/auth';

test.describe('Global Navigation & User Menu', () => {
  test('The organization dialog shows the organizations of the user', async ({
    loggedInPage,
    dashboardPage,
  }) => {
    // 1. Log in as the admin user.

    // 2. Close the help modal.
    await dashboardPage.userHelpModal.closeModal();

    // 3. Read the organization name from the top bar.
    const organizationName = (
      await dashboardPage.userMenu.headerOrganization.getLocator().innerText()
    ).trim();

    // 4. Open the user menu.
    await dashboardPage.userMenu.open();

    // 5. Click "Switch organization".
    await dashboardPage.userMenu.switchOrganization();

    // 6. Make sure that the dialog is visible.
    await dashboardPage.switchOrganizationDialog.dialog.shouldBeVisible();

    // 7. Make sure that the dialog holds the organization of the step 3.
    await expect(
      dashboardPage.switchOrganizationDialog.organizationOption(organizationName),
    ).toBeVisible();

    // 8. Make sure that the dialog marks that organization as the current one.
    await expect(
      dashboardPage.switchOrganizationDialog.organizationOption(organizationName),
    ).toBeChecked();

    // 9. Click "Cancel".
    await dashboardPage.switchOrganizationDialog.cancel();

    // 10. Make sure that the dialog is not visible.
    await expect(dashboardPage.switchOrganizationDialog.dialog.getLocator()).toBeHidden();

    // 11. Make sure that the top bar still shows the organization of the step 3.
    await dashboardPage.userMenu.checkHeaderOragnization(organizationName);

    // 12. Make sure that the dashboard content is available again.
    await expect(loggedInPage).toHaveURL(/dashboard/);
    await expect(dashboardPage.dashboardContainer.getLocator()).toBeVisible();
  });
});
