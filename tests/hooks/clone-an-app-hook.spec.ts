import { test } from '@fixtures/auth';
import { hookCase } from '@data/hooks';
import { HOOK_TEST_TIMEOUT } from '@data/timeouts';
import { testResourceName } from '@utils/resource-names';

test.describe('App hooks', () => {
  test.describe.configure({ timeout: HOOK_TEST_TIMEOUT });

  test('The user clones an app hook under a new name', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    hooksConfigurationPage,
    ccApi,
    toast,
    createdHooks,
  }) => {
    // Make a hook through the API
    const source = hookCase('POST_BACKUP');
    const clone = { ...source, name: testResourceName('hook-clone') };
    createdHooks.push(source.name, clone.name);
    await ccApi.hooks.create(source);

    // Log in as the admin user and open Configuration → App hooks
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.topNavigationBar.goToConfiguration();
    await configurationPage.configurationSideBar.goTo('App hooks');
    await hooksConfigurationPage.shouldOpen();
    await hooksConfigurationPage.shouldListHook(source);

    // Click "Clone" on that row
    const drawer = await hooksConfigurationPage.openCloneHookDrawer(source.name);
    await drawer.shouldHaveTitle('Add');

    // Make sure that the drawer copies everything but the name, and Save is off
    await drawer.shouldShowHook({ ...source, name: '' });
    await drawer.submit.shouldBeDisabled();

    // Type a new name and save
    await drawer.name.fill(clone.name);
    await drawer.submit.shouldBeEnabled();
    await drawer.saveNewHook();

    // Make sure that a success toast names the clone
    await toast.shouldShowSuccess(new RegExp(`Created hook: ${clone.name}`));
    await drawer.shouldBeClosed();

    // Make sure that the table lists both hooks with the same type and pod selector
    await hooksConfigurationPage.shouldListHook(source);
    await hooksConfigurationPage.shouldListHook(clone);

    // Reload the page and open the clone for viewing
    await loggedInPage.reload({ waitUntil: 'load' });
    const viewDrawer = await hooksConfigurationPage.openViewHookDrawer(clone.name);

    // Make sure that the clone holds the command of the source
    await viewDrawer.shouldShowHook(clone);
    await viewDrawer.closeView.click();
    await viewDrawer.shouldBeClosed();
  });
});
