// spec: specs/dashboard/dashboard.md (TC-DASH-001)

import { expect, test } from '@fixtures/auth';

test.describe('Dashboard', () => {
  test('The help modal appears and closes at the first login', async ({
    loggedInPage,
    dashboardPage,
    clustersPage,
  }) => {
    // 1. Log in as the admin user.

    // 2. Make sure that the modal "Need some help?" is visible.
    await dashboardPage.userHelpModal.title.shouldBeVisible();

    // 3. Make sure that the modal holds the option "Book a demo session with a CloudCasa expert".
    await dashboardPage.userHelpModal.bookDemoOption.shouldBeVisible();

    // 4. Make sure that the modal holds the option "Open documentation".
    await dashboardPage.userHelpModal.openDocumentationOption.shouldBeVisible();

    // 5. Make sure that the modal holds the option "Please do not show this popup again".
    await dashboardPage.userHelpModal.doNotShowAgainOption.shouldBeVisible();

    // 6. Make sure that the button "Confirm" is off while no option is selected.
    await dashboardPage.userHelpModal.confirmButton.shouldBeDisabled();

    // 7. Click the close button of the modal.
    await dashboardPage.userHelpModal.closeModal();

    // 8. Make sure that the modal is not visible.
    await expect(dashboardPage.userHelpModal.title.getLocator()).toBeHidden();

    // 9. Click a link of the dashboard content.
    await dashboardPage.clustersContentLink.click();

    // 10. Make sure that the link opens its page. This proves that the dashboard is usable.
    await clustersPage.shouldOpen();
  });
});
