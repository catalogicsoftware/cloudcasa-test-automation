// spec: spec/dashboard/dashboard.md (TC-DASH-006), spec/clusters/clusters.md (TC-CL-004),
// spec/clusters/backups-restores.md (TC-BAK-005)

import { expect, test } from '@fixtures/auth';

test.describe('Dashboard', () => {
  test('Each shortcut opens its target', async ({
    loggedInPage,
    dashboardPage,
    clustersPage,
    configurationPage,
  }) => {
    // 1. Log in as the admin user.

    // 2. Close the help modal.
    await dashboardPage.userHelpModal.closeModal();

    // 3. Make sure that the shortcuts panel holds these items: "Clusters Overview", "Add cluster", "Cloud accounts" and "Define cluster backup".
    await dashboardPage.shortcutsPanel.shouldBeVisible();
    await dashboardPage.clustersOverviewShortcut.shouldHaveText('Clusters Overview');
    await dashboardPage.addClusterShortcut.shouldHaveText('Add cluster');
    await dashboardPage.cloudAccountsShortcut.shouldHaveText('Cloud accounts');
    await dashboardPage.defineClusterBackupShortcut.shouldHaveText('Define cluster backup');

    // 4. Click "Clusters Overview".
    // 5. Make sure that the URL is /clusters.
    await dashboardPage.clustersOverviewShortcut.clickAndWaitForUrl(/\/clusters/);
    await clustersPage.shouldOpen();

    // 6. Go back to the dashboard.
    await dashboardPage.goto('/dashboard');
    await dashboardPage.userHelpModal.closeIfVisible();

    // 7. Click "Define cluster backup".
    // The ?new=true query disappears the instant the wizard opens, so the wait races the click instead of following it.
    await Promise.all([
      loggedInPage.waitForURL(/\/clusters\/backups\?new=true/),
      dashboardPage.defineClusterBackupShortcut.click(),
    ]);

    // 8. Make sure that the URL is /clusters/backups?new=true.
    // 9. Make sure that the wizard "Define cluster backup" is open.
    await expect(loggedInPage).toHaveURL(/\/clusters\/backups/);
    await clustersPage.defineClusterBackupWizard.title.shouldHaveText('Define cluster backup');

    // 10. Close the wizard with "Cancel".
    await clustersPage.defineClusterBackupWizard.cancel();
    await expect(clustersPage.defineClusterBackupWizard.wizard.getLocator()).toHaveCount(0);

    // 11. Go back to the dashboard and click "Cloud accounts".
    await dashboardPage.goto('/dashboard');
    await dashboardPage.userHelpModal.closeIfVisible();
    await dashboardPage.cloudAccountsShortcut.clickAndWaitForUrl(/\/configuration\/cloud-accounts/);

    // 12. Make sure that the URL is /configuration/cloud-accounts.
    await configurationPage.shouldOpen();
    await expect(loggedInPage).toHaveURL(/\/configuration\/cloud-accounts/);

    // 13. Go back to the dashboard and click "Add cluster".
    await dashboardPage.goto('/dashboard');
    await dashboardPage.userHelpModal.closeIfVisible();
    await dashboardPage.addClusterShortcut.click();

    // 14. Make sure that the URL is /clusters?new=true and that the dialog "Add Cluster" is open. Actual: the URL settles on /clusters/overview and no dialog opens, for the shortcut and for the in-page "Add cluster" button alike. Expected: the URL becomes /clusters?new=true and the "Add Cluster" dialog opens.
    test.fixme();

    // No cluster or backup is ever created: the Add Cluster dialog never opens and the backup wizard is cancelled before "Create".
  });
});
