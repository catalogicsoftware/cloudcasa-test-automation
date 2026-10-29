import { test } from '@fixtures/auth';
import { HOOK_TYPE_LABELS, hookCase } from '@data/hooks';
import { HOOK_LIST_RELOAD_TIMEOUT, HOOK_TEST_TIMEOUT } from '@data/timeouts';
import { testResourceName } from '@utils/resource-names';

test.describe('App hooks', () => {
  test.describe.configure({ timeout: HOOK_TEST_TIMEOUT });

  test('The app hooks filters find a hook by name and by type', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    hooksConfigurationPage,
    ccApi,
    createdHooks,
  }) => {
    // Make a pre-backup hook and a post-restore hook through the API
    const preBackup = hookCase('PRE_BACKUP');
    const postRestore = hookCase('POST_RESTORE');
    for (const hook of [preBackup, postRestore]) {
      createdHooks.push(hook.name);
      await ccApi.hooks.create(hook);
    }

    // Log in as the admin user and open Configuration → App hooks
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.topNavigationBar.goToConfiguration();
    await configurationPage.configurationSideBar.goTo('App hooks');
    await hooksConfigurationPage.shouldOpen();

    // Make sure that the table lists both hooks
    await hooksConfigurationPage.shouldListHook(preBackup);
    await hooksConfigurationPage.shouldListHook(postRestore);

    // Filter by the name of the pre-backup hook
    await hooksConfigurationPage.filterByName(preBackup.name);

    // Make sure that the table shows that hook only
    await hooksConfigurationPage.hooksTable.shouldHaveRowCount(1, HOOK_LIST_RELOAD_TIMEOUT);
    await hooksConfigurationPage.shouldListHook(preBackup);

    // Filter by a name that no hook uses and make sure that the empty state shows
    await hooksConfigurationPage.filterByName(testResourceName('no-such-hook'));
    await hooksConfigurationPage.emptyState.shouldBeVisible({}, HOOK_LIST_RELOAD_TIMEOUT);

    // Clear the name filter and make sure that both hooks come back
    await hooksConfigurationPage.filterByName('');
    await hooksConfigurationPage.shouldListHook(preBackup);
    await hooksConfigurationPage.shouldListHook(postRestore);

    // Filter by the type Post-restore
    await hooksConfigurationPage.toggleTypeFilter(HOOK_TYPE_LABELS.POST_RESTORE);

    // Make sure that the post-restore hook stays and the pre-backup hook leaves
    await hooksConfigurationPage.typeFilter.shouldHaveText(
      `Type: ${HOOK_TYPE_LABELS.POST_RESTORE}`,
    );
    await hooksConfigurationPage.shouldListHook(postRestore);
    await hooksConfigurationPage.shouldNotListHook(preBackup.name);
  });
});
