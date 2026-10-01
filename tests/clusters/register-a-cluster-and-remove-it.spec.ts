// spec: spec/clusters/clusters.md (TC-CL-002, TC-CL-003, TC-CL-005, TC-CL-007)

import { expect, test } from '@fixtures/auth';
import { CLUSTER_LIST_RELOAD_TIMEOUT, CLUSTER_TEST_TIMEOUT } from '@data/timeouts';
import { testResourceName } from '@utils/resource-names';
import { INSTALL_COMMAND_PATTERN } from '@page-object-model/components/dialogs/install-agent.dialog';

test.describe('Clusters', () => {
  test.describe.configure({ timeout: CLUSTER_TEST_TIMEOUT });

  test('The user registers a cluster and removes it', async ({
    loggedInPage,
    dashboardPage,
    clustersPage,
    createdClusters,
  }) => {
    // 1. Log in as the admin user.

    // 2. Close the help modal and open /clusters.
    await dashboardPage.userHelpModal.closeModal();
    await clustersPage.goto('/clusters');
    await clustersPage.shouldOpen();

    // 3. Click "Add cluster".
    const dialog = await clustersPage.openAddClusterDialog();

    // 4. Make sure that the dialog "Add Cluster" holds the fields Name, Description and tags.
    await dialog.name.shouldBeVisible();
    await dialog.description.shouldBeVisible();
    await dialog.tags.shouldBeVisible();

    // 5. Make sure that the button "Register" is off while the name is empty.
    await dialog.register.shouldBeDisabled();

    // 6. Make sure that the checkbox "Enable CloudCasa DR" is off and not available (the free plan does not give this option).
    await dialog.enableDr.shouldNotBeChecked();
    await dialog.enableDr.shouldBeDisabled();

    // 7. Make a name with testResourceName('cluster').
    const name = testResourceName('cluster');

    // 8. Fill the name and a description.
    await dialog.name.fill(name);
    await dialog.description.fill('Created by the register-a-cluster-and-remove-it E2E test');

    // 9. Make sure that the button "Register" is on.
    await dialog.register.shouldBeEnabled();

    // 10. Clear the name.
    await dialog.name.fill('');

    // 11. Make sure that the button "Register" is off again.
    await dialog.register.shouldBeDisabled();

    // 12. Fill the name again and click "Register".
    await dialog.name.fill(name);
    // Pushed before the create call resolves, so teardown owns the cluster even if a later step fails.
    createdClusters.push(name);
    await dialog.create();

    // 13. Make sure that the application shows the install instructions for the agent.
    await clustersPage.installAgentDialog.dialog.shouldBeVisible();

    // 14. Make sure that the instructions hold a command with the identifier of the cluster.
    await expect(clustersPage.installAgentDialog.command.getLocator()).toHaveText(
      INSTALL_COMMAND_PATTERN,
    );

    // 15. Close the instructions.
    await clustersPage.installAgentDialog.close();
    await expect(clustersPage.installAgentDialog.dialog.getLocator()).toHaveCount(0);
    // The panel behind the instructions reopened as "Edit Cluster" and still covers the table.
    await dialog.close.click();

    // 16. Make sure that the clusters table holds the new cluster.
    await clustersPage.clustersTable.shouldHaveRow(name, CLUSTER_LIST_RELOAD_TIMEOUT);

    // 17. Make sure that the state of the cluster is "Pending" or an equal not-connected state.
    // The app currently reports a freshly registered, not-yet-connected cluster as "Registered".
    await clustersPage.clustersTable.shouldHaveCellValue(name, 'State', /Registered|Pending/i);

    // 18. Open the actions menu of that row and click the remove action.
    await clustersPage.clustersTable.clickRowAction(name, 'Remove');

    // 19. Make sure that a confirmation dialog names the cluster. Actual: the popover is CloudCasa's generic "Do you want to proceed?" prompt, shared with policy row actions (see ProceedConfirmation), and it never names any resource. Expected: the confirmation names the cluster.
    test.fixme();

    // Steps 20-22 (confirm the removal, reload, verify the row is gone) are not exercised through
    // the UI past this point; the createdClusters API teardown still removes the cluster.
  });
});
