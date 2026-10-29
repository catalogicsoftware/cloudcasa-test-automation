import { test } from '@fixtures/auth';
import { hookCase } from '@data/hooks';
import { HOOK_TEST_TIMEOUT } from '@data/timeouts';

test.describe('App hooks', () => {
  test.describe.configure({ timeout: HOOK_TEST_TIMEOUT });

  test('The user removes an app from a saved app hook', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    hooksConfigurationPage,
    ccApi,
    toast,
    createdHooks,
  }) => {
    // Make a hook with two apps through the API
    const original = hookCase('POST_RESTORE', 2);
    const [removedApp, keptApp] = original.apps;
    const updated = { ...original, apps: [keptApp] };
    createdHooks.push(original.name);
    await ccApi.hooks.create(original);

    // Log in as the admin user and open Configuration → App hooks
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.topNavigationBar.goToConfiguration();
    await configurationPage.configurationSideBar.goTo('App hooks');
    await hooksConfigurationPage.shouldOpen();

    // Make sure that the table lists both apps
    await hooksConfigurationPage.shouldListHook(original);

    // Open the edit action of that row and make sure that it shows both apps
    const drawer = await hooksConfigurationPage.openEditHookDrawer(original.name);
    await drawer.shouldShowHook(original);

    // Remove the first app
    await drawer.app(1).remove.click();

    // Make sure that only the second app is left and it can no longer be removed
    await drawer.shouldHaveAppCount(1);
    await drawer.app(1).shouldShow(keptApp);
    await drawer.app(1).shouldNotBeRemovable();

    // Save the drawer
    await drawer.saveChanges();
    await toast.shouldShowSuccess(new RegExp(`Updated hook: ${original.name}`));
    await drawer.shouldBeClosed();

    // Reload the page and make sure that the table lists the kept app only
    await loggedInPage.reload({ waitUntil: 'load' });
    await hooksConfigurationPage.shouldListHook(updated);
    await hooksConfigurationPage.shouldNotListApp(original.name, removedApp);

    // Open the edit action again and make sure that the drawer holds the kept app only
    const reopened = await hooksConfigurationPage.openEditHookDrawer(original.name);
    await reopened.shouldShowHook(updated);
    await reopened.close();
    await reopened.shouldBeClosed();
  });
});
