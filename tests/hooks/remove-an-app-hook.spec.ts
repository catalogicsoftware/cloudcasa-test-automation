import { test } from '@fixtures/auth';
import { hookCase } from '@data/hooks';
import { HOOK_TEST_TIMEOUT } from '@data/timeouts';

test.describe('App hooks', () => {
  test.describe.configure({ timeout: HOOK_TEST_TIMEOUT });

  test('The user removes an app hook after confirming', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    hooksConfigurationPage,
    ccApi,
    createdHooks,
  }) => {
    // Make a hook through the API
    const hook = hookCase('POST_RESTORE');
    createdHooks.push(hook.name);
    await ccApi.hooks.create(hook);

    // Log in as the admin user and open Configuration → App hooks
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.topNavigationBar.goToConfiguration();
    await configurationPage.configurationSideBar.goTo('App hooks');
    await hooksConfigurationPage.shouldOpen();

    // Make sure that the table lists the hook
    await hooksConfigurationPage.shouldListHook(hook);

    // Click "Remove" on that row and answer "No"
    let confirmation = await hooksConfigurationPage.startRemovingHook(hook.name);
    await confirmation.decline();

    // Make sure that the hook is still listed
    await hooksConfigurationPage.shouldListHook(hook);

    // Click "Remove" again and answer "Yes"
    confirmation = await hooksConfigurationPage.startRemovingHook(hook.name);
    await confirmation.confirm();

    // Make sure that the hook leaves the table
    await hooksConfigurationPage.shouldNotListHook(hook.name);

    // Reload the page and make sure that the hook stays gone
    await loggedInPage.reload({ waitUntil: 'load' });
    await hooksConfigurationPage.shouldOpen();
    await hooksConfigurationPage.shouldNotListHook(hook.name);
  });
});
