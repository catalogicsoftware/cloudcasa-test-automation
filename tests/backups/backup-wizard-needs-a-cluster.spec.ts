// spec: specs/clusters/backups-restores.md (TC-BAK-001, TC-BAK-004)

import { test } from '@fixtures/auth';
import { testResourceName } from '@utils/resource-names';
import { BACKUPS_LIST_RELOAD_TIMEOUT } from '@data/timeouts';

test.describe('Cluster Backups', () => {
  test('The backup wizard refuses a backup without a cluster', async ({
    loggedInPage,
    dashboardPage,
    backupsPage,
  }) => {
    // 1. Log in as the admin user.

    // 2. Close the help modal and open /clusters/backups.
    await dashboardPage.userHelpModal.closeModal();
    await backupsPage.goto('/clusters/backups');
    await backupsPage.shouldOpen();

    // 3. Make sure that the table holds the columns Backup name, Cluster, Policy, Last run
    //    and Last 3 runs.
    await backupsPage.shouldHaveColumns();

    // 4. Type a name that no backup uses in the filter "Backup name".
    const unusedBackupName = testResourceName('no-such-backup');
    await backupsPage.backupNameFilter.fill(unusedBackupName);

    // 5. Make sure that the table shows the empty state.
    await backupsPage.backupsTable.shouldBeEmpty();

    // 6. Clear the filter.
    await backupsPage.backupNameFilter.fill('');
    const existingBackupCount = await backupsPage.backupsTable.rowCount();

    // 7. Click "Define backup".
    const wizard = await backupsPage.openDefineBackupWizard();

    // 8. Make sure that the wizard holds the steps Cluster, Selections, App hooks, Policy and
    //    Summary.
    await wizard.shouldHaveWizardSteps();

    // 9. Make sure that the steps 2 to 5 of the wizard are not available while no cluster is
    //    selected.
    await wizard.shouldLockStepsWithoutACluster();

    // 10. Make sure that the buttons "Next" and "Create" are off.
    await wizard.shouldDisableNextAndCreate();

    // 11. Click "Cancel".
    await wizard.cancel.click();

    // 12. Make sure that the wizard is closed.
    await wizard.shouldBeClosed();

    // 13. Reload the page.
    await backupsPage.reloadPage();
    await backupsPage.shouldOpen();

    // 14. Make sure that the table holds no new backup.
    await backupsPage.backupsTable.shouldHaveRowCount(
      existingBackupCount,
      BACKUPS_LIST_RELOAD_TIMEOUT,
    );
  });
});
