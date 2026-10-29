import { test } from '@fixtures/auth';
import { hookApp, hookCase } from '@data/hooks';
import { HOOK_TEST_TIMEOUT } from '@data/timeouts';

test.describe('App hooks', () => {
  test.describe.configure({ timeout: HOOK_TEST_TIMEOUT });

  test('The user changes an app hook and the change stays', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    hooksConfigurationPage,
    ccApi,
    toast,
    createdHooks,
  }) => {
    // Make a post-backup hook through the API
    const original = hookCase('POST_BACKUP');
    createdHooks.push(original.name);
    await ccApi.hooks.create(original);
    const [originalApp] = original.apps;
    const updatedApp = hookApp({ withContainer: true });
    const updated = { ...original, type: 'COMMON' as const, apps: [updatedApp] };

    // Log in as the admin user and open Configuration → App hooks
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.topNavigationBar.goToConfiguration();
    await configurationPage.configurationSideBar.goTo('App hooks');
    await hooksConfigurationPage.shouldOpen();

    // Make sure that the table lists the hook with its first values
    await hooksConfigurationPage.shouldListHook(original);

    // Open the edit action of that row and make sure that it shows the first values
    const drawer = await hooksConfigurationPage.openEditHookDrawer(original.name);
    await drawer.shouldHaveTitle('Edit');
    await drawer.shouldShowHook(original);

    // Change the type, replace the pod selector, name a container and change the command
    await drawer.hookType.select({ value: updated.type });
    await drawer.app(1).removePodSelector(originalApp.podSelector);
    await drawer.app(1).addPodSelector(updatedApp.podSelector);
    await drawer.app(1).container.fill(updatedApp.container);
    await drawer.app(1).command.fill(updatedApp.command);

    // Save the drawer
    await drawer.saveChanges();

    // Make sure that a success toast names the hook and the drawer closes
    await toast.shouldShowSuccess(new RegExp(`Updated hook: ${original.name}`));
    await drawer.shouldBeClosed();

    // Make sure that the table shows the new values before reloading the page
    await hooksConfigurationPage.shouldListHook(updated);

    // Reload the page and make sure that the new values stay
    await loggedInPage.reload({ waitUntil: 'load' });
    await hooksConfigurationPage.shouldListHook(updated);

    // Open the edit action again and make sure that the drawer holds the new values
    const reopened = await hooksConfigurationPage.openEditHookDrawer(original.name);
    await reopened.shouldShowHook(updated);

    // Close the drawer
    await reopened.close();
    await reopened.shouldBeClosed();
  });
});
