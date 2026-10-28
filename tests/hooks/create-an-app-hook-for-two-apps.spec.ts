import { test } from '@fixtures/auth';
import { hookApp, hookCase } from '@data/hooks';
import { HOOK_TEST_TIMEOUT } from '@data/timeouts';

test.describe('App hooks', () => {
  test.describe.configure({ timeout: HOOK_TEST_TIMEOUT });

  test('The user creates an app hook for two apps', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    hooksConfigurationPage,
    toast,
    createdHooks,
  }) => {
    // The first app runs in a named container, the second in the pod's default one
    const hook = { ...hookCase('PRE_BACKUP'), apps: [hookApp({ withContainer: true }), hookApp()] };
    const [firstApp, secondApp] = hook.apps;
    createdHooks.push(hook.name);

    // Log in as the admin user and open Configuration → App hooks
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.topNavigationBar.goToConfiguration();
    await configurationPage.configurationSideBar.goTo('App hooks');
    await hooksConfigurationPage.shouldOpen();

    // Open the drawer that adds a hook and fill the name, the type and the first app
    const drawer = await hooksConfigurationPage.openAddHookDrawer();
    await drawer.name.fill(hook.name);
    await drawer.hookType.select({ value: hook.type });
    await drawer.app(1).fill(firstApp);

    // Make sure that a single app cannot be removed and Save is on
    await drawer.shouldHaveAppCount(1);
    await drawer.app(1).shouldNotBeRemovable();
    await drawer.submit.shouldBeEnabled();

    // Click "Add app"
    await drawer.addApp.click();

    // Make sure that a second, empty app appears and Save is off until it is filled
    await drawer.shouldHaveAppCount(2);
    await drawer.submit.shouldBeDisabled();

    // Fill the second app
    await drawer.app(2).fill(secondApp);

    // Make sure that Save is on and save
    await drawer.submit.shouldBeEnabled();
    await drawer.saveNewHook();

    // Make sure that a success toast names the hook and the drawer closes
    await toast.shouldShowSuccess(new RegExp(`Created hook: ${hook.name}`));
    await drawer.shouldBeClosed();

    // Make sure that the table lists both apps, each with its container
    await hooksConfigurationPage.shouldListHook(hook);

    // Reload the page and make sure that both apps stay
    await loggedInPage.reload({ waitUntil: 'load' });
    await hooksConfigurationPage.shouldListHook(hook);

    // Open the hook for viewing and make sure that it holds both apps
    const viewDrawer = await hooksConfigurationPage.openViewHookDrawer(hook.name);
    await viewDrawer.shouldShowHook(hook);
    await viewDrawer.closeView.click();
    await viewDrawer.shouldBeClosed();
  });
});
