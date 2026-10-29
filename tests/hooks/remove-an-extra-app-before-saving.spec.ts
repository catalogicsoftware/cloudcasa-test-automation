import { test } from '@fixtures/auth';
import { hookCase } from '@data/hooks';
import { HOOK_TEST_TIMEOUT } from '@data/timeouts';

test.describe('App hooks', () => {
  test.describe.configure({ timeout: HOOK_TEST_TIMEOUT });

  test('The user removes an extra app before saving the hook', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    hooksConfigurationPage,
    toast,
    createdHooks,
  }) => {
    const filled = hookCase('POST_BACKUP', 3);
    const [firstApp, middleApp, lastApp] = filled.apps;
    const saved = { ...filled, apps: [firstApp, lastApp] };
    createdHooks.push(filled.name);

    // Log in as the admin user and open Configuration → App hooks
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.topNavigationBar.goToConfiguration();
    await configurationPage.configurationSideBar.goTo('App hooks');
    await hooksConfigurationPage.shouldOpen();

    // Open the drawer that adds a hook and fill it with three apps through "Add app"
    const drawer = await hooksConfigurationPage.openAddHookDrawer();
    await drawer.fillRequiredFields(filled);
    await drawer.shouldHaveAppCount(3);

    // Remove the middle app
    await drawer.app(2).remove.click();

    // Make sure that two apps are left and they are the first and the last one
    await drawer.shouldHaveAppCount(2);
    await drawer.app(1).shouldShow(firstApp);
    await drawer.app(2).shouldShow(lastApp);

    // Save
    await drawer.saveNewHook();
    await toast.shouldShowSuccess(new RegExp(`Created hook: ${filled.name}`));
    await drawer.shouldBeClosed();

    // Make sure that the table lists the two apps that are left and not the removed one
    await hooksConfigurationPage.shouldListHook(saved);
    await hooksConfigurationPage.shouldNotListApp(filled.name, middleApp);

    // Reload the page and open the hook for viewing
    await loggedInPage.reload({ waitUntil: 'load' });
    const viewDrawer = await hooksConfigurationPage.openViewHookDrawer(filled.name);

    // Make sure that the hook holds exactly the two apps that are left
    await viewDrawer.shouldShowHook(saved);
    await viewDrawer.closeView.click();
    await viewDrawer.shouldBeClosed();
  });
});
