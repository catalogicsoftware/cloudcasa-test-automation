// spec: specs/dashboard/dashboard.md (TC-DASH-003)

import { expect, test } from '@fixtures/auth';

test.describe('Dashboard', () => {
  test('The dashboard shows the status of the organization', async ({
    loggedInPage,
    dashboardPage,
    clustersPage,
    ccApi,
  }) => {
    // 1. Log in as the admin user.

    // 2. Close the help modal.
    await dashboardPage.userHelpModal.closeModal();

    // 3. Make sure that the URL is /dashboard.
    await dashboardPage.shouldOpen();

    // 4. Make sure that the job counters are visible: Running, Successful, Partial, Skipped and Failed.
    for (const label of ['Running', 'Successful', 'Partial', 'Skipped', 'Failed']) {
      await expect(dashboardPage.jobStatusCounter(label)).toBeVisible();
    }

    // 5. Make sure that the clusters card holds the headings Configured, Healthy and Protected.
    for (const label of ['Configured', 'Healthy', 'Protected']) {
      await expect(dashboardPage.clustersCardHeading(label)).toBeVisible();
    }

    // 6. Make sure that the cloud providers card holds the links Google, Azure and Amazon.
    for (const provider of ['Google', 'Azure', 'Amazon']) {
      await expect(dashboardPage.cloudProviderLink(provider)).toBeVisible();
    }

    // 7. Make sure that the databases card holds the counters of the accounts and of the protected databases.
    await expect(dashboardPage.databasesCounter('Accounts')).toBeVisible();
    await expect(dashboardPage.databasesCounter('Protected DBs')).toBeVisible();

    // 8. Make sure that the shortcuts panel and the alerts panel are visible.
    await dashboardPage.shortcutsPanel.shouldBeVisible();
    await dashboardPage.alertsPanel.shouldBeVisible();

    // 9. Make sure that no card shows an error state.
    await expect(
      loggedInPage.locator(
        'app-dashboard .text-danger, app-dashboard .alert-danger, app-dashboard [class*="error"]',
      ),
    ).toHaveCount(0);

    // Get the expected counts from the API and compare them with the numbers of the cards.
    const stats = await ccApi.dashboard.getStats();
    await expect(dashboardPage.clustersCardValue('Configured')).toHaveText(
      String(stats.kubernetes.num_clusters),
    );

    // 10. Click the link of the clusters card.
    await dashboardPage.clustersCardLink.clickAndWaitForUrl(/\/clusters/);

    // 11. Make sure that the URL is /clusters.
    await clustersPage.shouldOpen();

    // 12. Make sure that the number of the rows agrees with the counter "Configured".
    await clustersPage.clustersTable.shouldHaveRowCount(stats.kubernetes.num_clusters);
  });
});
