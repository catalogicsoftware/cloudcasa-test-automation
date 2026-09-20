// spec: spec/dashboard/dashboard.md (TC-DASH-004, TC-DASH-007)

import { CcApiRoutes } from '@data/api-routes';
import { expect, test } from '@fixtures/auth';

test.describe('Dashboard', () => {
  test('The jobs table changes with the tab and with the time range', async ({
    loggedInPage,
    dashboardPage,
  }) => {
    // 1. Log in as the admin user.

    // 2. Close the help modal.
    await dashboardPage.userHelpModal.closeModal();

    // 3. Make sure that the tab "Activity" shows the columns Job name, Type, Message, Started,
    //    Duration and Status.
    // The active tab is a per-account preference and this account is shared across CI
    // workers, so the Activity tab is selected explicitly instead of assumed as the default.
    await dashboardPage.activityTab.click();
    await dashboardPage.shouldHaveActivityColumns();

    // A full page reload would tear down this listener along with everything else, so its
    // count proves step 11 (no full reload happened while switching tabs below).
    let fullPageLoads = 0;
    loggedInPage.on('load', () => fullPageLoads++);

    // 4. Click the tab "Cluster backups".
    await dashboardPage.clusterBackupsTab.click();

    // 5. Make sure that the URL query holds activeTab=backups.
    await expect(loggedInPage).toHaveURL(/activeTab=backups/);

    // 6. Make sure that the table of the cluster backups is visible.
    await dashboardPage.clusterBackupsTable.shouldBeVisible();

    // 7. Click the tab "Database backups".
    await dashboardPage.databaseBackupsTab.click();

    // 8. Make sure that the table of the database backups is visible.
    await dashboardPage.databaseBackupsTable.shouldBeVisible();

    // 9. Click the tab "Activity" again.
    await dashboardPage.activityTab.click();

    // 10. Make sure that the columns of the step 3 come back.
    await dashboardPage.shouldHaveActivityColumns();

    // 11. Make sure that the page did not do a full reload during the steps 4 to 9.
    expect(fullPageLoads).toBe(0);

    // 12. Open the selector "last 24h".
    await dashboardPage.jobsTimeRange.open();

    // 13. Select a different range.
    const jobsReadAgain = loggedInPage.waitForResponse(
      response =>
        response.url().includes(CcApiRoutes.DASHBOARD) && response.request().method() === 'GET',
    );
    await dashboardPage.jobsTimeRange.selectRange('last 7 days');

    // 14. Make sure that the button shows the new range.
    await dashboardPage.jobsTimeRange.trigger.shouldHaveText('last 7 days');

    // 15. Make sure that the jobs table reads the data again.
    const jobsReadAgainResponse = await jobsReadAgain;
    expect(jobsReadAgainResponse.ok()).toBeTruthy();
  });
});
