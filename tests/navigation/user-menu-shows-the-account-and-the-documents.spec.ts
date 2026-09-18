// spec: specs/navigation/navigation.md (TC-NAV-004, TC-NAV-006)

import { expect, test } from '@fixtures/auth';
import { Link } from '@page-factory/link';

test.describe('Global Navigation & User Menu', () => {
  test('The user menu shows the identity and opens the legal documents', async ({
    loggedInPage,
    dashboardPage,
    adminUser,
    request,
  }) => {
    // 1. Log in as the admin user.

    // 2. Close the help modal.
    await dashboardPage.userHelpModal.closeModal();

    // 3. Open the user menu.
    await dashboardPage.userMenu.open();

    // 4. Make sure that the menu shows the name of the user.
    await dashboardPage.userMenu.userMenuName.shouldBeVisible();
    await expect(dashboardPage.userMenu.userMenuName.getLocator()).not.toBeEmpty();

    // 5. Make sure that the menu holds these items: Switch organization, Privacy policy, Terms
    //    of service, API guide, Open source notices, User settings and Logout.
    await dashboardPage.userMenu.switchOrganizationButton.shouldBeVisible();
    await dashboardPage.userMenu.privacyPolicyLink.shouldBeVisible();
    await dashboardPage.userMenu.termsOfServiceLink.shouldBeVisible();
    await dashboardPage.userMenu.apiGuideLink.shouldBeVisible();
    await dashboardPage.userMenu.openSourceNoticesLink.shouldBeVisible();
    await dashboardPage.userMenu.userSettingsLink.shouldBeVisible();
    await dashboardPage.userMenu.logoutButton.shouldBeVisible();

    // 6. Make sure that the organization button of the top bar shows the organization of the account.
    await dashboardPage.userMenu.checkHeaderOragnization(adminUser.organization);

    // 7 to 11. Click each legal document link, catch the new page, and make sure it opens the
    // published document. "Open source notices" and "User settings" are not legal documents and
    // stay out of this loop.
    const legalDocuments: Link[] = [
      dashboardPage.userMenu.privacyPolicyLink,
      dashboardPage.userMenu.termsOfServiceLink,
      dashboardPage.userMenu.apiGuideLink,
    ];

    for (const documentLink of legalDocuments) {
      await expect(documentLink.getLocator()).toHaveAttribute('href', /.+/);
      const href = (await documentLink.getLocator().getAttribute('href')) as string;

      // The status check below follows the same redirect, so the published URL and the
      // status come from a single HEAD request instead of downloading the document twice.
      const headResponse = await request.head(href);
      const publishedUrl = headResponse.url();

      const [newPage] = await Promise.all([
        loggedInPage.waitForEvent('popup'),
        documentLink.click(),
      ]);
      await newPage.waitForLoadState();

      // 8. Make sure that the new page opens the published privacy policy URL.
      expect(newPage.url()).toBe(publishedUrl);

      // 12. Make sure that each document answers with the status 200.
      expect(headResponse.status()).toBe(200);

      await newPage.close();

      // 9. Go back to the application and open the user menu again.
      await dashboardPage.userMenu.open();
    }
  });
});
