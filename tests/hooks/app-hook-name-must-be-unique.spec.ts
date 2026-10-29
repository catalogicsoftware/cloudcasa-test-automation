import { test } from '@fixtures/auth';
import { hookCase } from '@data/hooks';
import { HOOK_TEST_TIMEOUT } from '@data/timeouts';

const NOT_UNIQUE = 'This value is not unique';

test.describe('App hooks', () => {
  test.describe.configure({ timeout: HOOK_TEST_TIMEOUT });

  test('A second app hook needs a name of its own', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    hooksConfigurationPage,
    ccApi,
    toast,
    createdHooks,
  }) => {
    // Make a hook through the API
    const existing = hookCase('PRE_BACKUP');
    const second = hookCase('POST_BACKUP');
    createdHooks.push(existing.name, second.name);
    await ccApi.hooks.create(existing);

    // Log in as the admin user and open Configuration → App hooks
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.topNavigationBar.goToConfiguration();
    await configurationPage.configurationSideBar.goTo('App hooks');
    await hooksConfigurationPage.shouldOpen();

    // Open the drawer that adds a hook, type the name of the existing hook and leave the field
    const drawer = await hooksConfigurationPage.openAddHookDrawer();
    await drawer.name.fill(existing.name);
    await drawer.name.getLocator().press('Tab');

    // Make sure that the name is refused
    await drawer.shouldShowNameError(NOT_UNIQUE);

    // Fill Type, Pod selector and Command
    await drawer.hookType.select({ value: second.type });
    await drawer.app(1).fill(second.apps[0]);

    // Make sure that Save stays off while the name is taken
    await drawer.submit.shouldBeDisabled();

    // Change the name to a new one
    await drawer.name.fill(second.name);

    // Make sure that the error is gone and Save is on
    await drawer.shouldNotShowNameError(NOT_UNIQUE);
    await drawer.submit.shouldBeEnabled();

    // Save
    await drawer.saveNewHook();
    await toast.shouldShowSuccess(new RegExp(`Created hook: ${second.name}`));

    // Make sure that both hooks are listed, each with its own values
    await hooksConfigurationPage.shouldListHook(existing);
    await hooksConfigurationPage.shouldListHook(second);
  });
});
