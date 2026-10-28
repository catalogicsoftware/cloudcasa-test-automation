import { expect, test } from '@fixtures/auth';
import { MYSQL_PRE_BACKUP_TEMPLATE } from '@data/hooks';
import { HOOK_TEST_TIMEOUT } from '@data/timeouts';
import { testResourceName } from '@utils/resource-names';

test.describe('App hooks', () => {
  test.describe.configure({ timeout: HOOK_TEST_TIMEOUT });

  test('The user creates an app hook from a template', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    hooksConfigurationPage,
    toast,
    createdHooks,
  }) => {
    const name = testResourceName('hook-mysql');
    createdHooks.push(name);
    const { type, podSelector } = MYSQL_PRE_BACKUP_TEMPLATE;

    // Log in as the admin user and open Configuration → App hooks
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.topNavigationBar.goToConfiguration();
    await configurationPage.configurationSideBar.goTo('App hooks');
    await hooksConfigurationPage.shouldOpen();

    // Open the drawer that adds a hook and pick the MySQL pre-backup template
    const drawer = await hooksConfigurationPage.openAddHookDrawer();
    await drawer.selectTemplate(MYSQL_PRE_BACKUP_TEMPLATE.name);

    // Make sure that the template fills the type, the pod selector and the command
    await drawer.hookType.shouldBeSelected({ value: type });
    await drawer.app(1).podSelectorBadges.shouldBeVisible();
    await expect(drawer.app(1).podSelectorBadges.getLocator()).toContainText(podSelector.value);
    await expect(drawer.app(1).command.getLocator()).toHaveValue(MYSQL_PRE_BACKUP_TEMPLATE.command);

    // Make sure that Save stays off until the hook has a name
    await drawer.submit.shouldBeDisabled();

    // Type a name and save
    await drawer.name.fill(name);
    await drawer.submit.shouldBeEnabled();
    await drawer.saveNewHook();
    await toast.shouldShowSuccess(new RegExp(`Created hook: ${name}`));

    // Reload the page and make sure that the hook is listed with the template's values
    await loggedInPage.reload({ waitUntil: 'load' });
    await hooksConfigurationPage.shouldListHook({
      name,
      type,
      apps: [{ podSelector, container: '', command: '' }],
    });

    // Open the hook for viewing and make sure that it keeps the template's command
    const viewDrawer = await hooksConfigurationPage.openViewHookDrawer(name);
    await expect(viewDrawer.app(1).command.getLocator()).toHaveValue(
      MYSQL_PRE_BACKUP_TEMPLATE.command,
    );
    await viewDrawer.closeView.click();
    await viewDrawer.shouldBeClosed();
  });
});
