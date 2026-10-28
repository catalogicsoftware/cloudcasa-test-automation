import { test } from '@fixtures/auth';
import { HOOK_TYPE_LABELS, HOOK_TYPES, hookCase } from '@data/hooks';
import { HOOK_TEST_TIMEOUT } from '@data/timeouts';

test.describe('App hooks', () => {
  test.describe.configure({ timeout: HOOK_TEST_TIMEOUT });

  for (const type of HOOK_TYPES) {
    test(`The user creates a ${HOOK_TYPE_LABELS[type]} app hook`, async ({
      loggedInPage,
      dashboardPage,
      configurationPage,
      hooksConfigurationPage,
      toast,
      createdHooks,
    }) => {
      const hook = hookCase(type);
      createdHooks.push(hook.name);

      // Log in as the admin user and open Configuration → App hooks
      await dashboardPage.userHelpModal.closeModal();
      await dashboardPage.topNavigationBar.goToConfiguration();
      await configurationPage.configurationSideBar.goTo('App hooks');
      await hooksConfigurationPage.shouldOpen();

      // Open the drawer that adds a hook
      let drawer = await hooksConfigurationPage.openAddHookDrawer();
      await drawer.shouldHaveTitle('Add');

      // Make sure that Save is off while the required fields are empty
      await drawer.submit.shouldBeDisabled();

      // Fill Name, Type, Pod selector and Command
      await drawer.fillRequiredFields(hook);

      // Make sure that Save is on
      await drawer.submit.shouldBeEnabled();

      // Clear the name and make sure that Save is off again
      await drawer.name.fill('');
      await drawer.submit.shouldBeDisabled();

      // Click "Cancel" and make sure that no hook was created
      await drawer.close();
      await drawer.shouldBeClosed();
      await hooksConfigurationPage.shouldNotListHook(hook.name);

      // Open the drawer again, fill every required field and save
      drawer = await hooksConfigurationPage.openAddHookDrawer();
      await drawer.fillRequiredFields(hook);
      await drawer.saveNewHook();

      // Make sure that a success toast names the hook and the drawer closes
      await toast.shouldShowSuccess(new RegExp(`Created hook: ${hook.name}`));
      await drawer.shouldBeClosed();

      // Make sure that the table lists the hook with its type and pod selector
      await hooksConfigurationPage.shouldListHook(hook);

      // Reload the page and make sure that the hook stays
      await loggedInPage.reload({ waitUntil: 'load' });
      await hooksConfigurationPage.shouldListHook(hook);

      // Open the hook for viewing and make sure that it holds the saved values
      const viewDrawer = await hooksConfigurationPage.openViewHookDrawer(hook.name);
      await viewDrawer.shouldHaveTitle('View');
      await viewDrawer.shouldShowHook(hook);

      // Close the view
      await viewDrawer.closeView.click();
      await viewDrawer.shouldBeClosed();
    });
  }
});
