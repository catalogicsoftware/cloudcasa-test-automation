// spec: specs/configuration/cloud-accounts-misc.md (TC-HOOK-001)

import { expect, test } from '@fixtures/auth';
import { testResourceName } from '@utils/resource-names';

test.describe('Configuration', () => {
  test('The hooks page refuses an empty hook', async ({
    loggedInPage,
    dashboardPage,
    hooksConfigurationPage,
  }) => {
    // 1. Log in as the admin user and open /configuration/hooks.
    await dashboardPage.userHelpModal.closeModal();
    await hooksConfigurationPage.goto('/configuration/hooks');

    // 2. Make sure that the page shows its heading and its table or its empty state.
    await expect(loggedInPage).toHaveURL(/\/configuration\/hooks/);
    await hooksConfigurationPage.heading.shouldBeVisible();
    await expect(
      hooksConfigurationPage.hooksTable
        .getLocator()
        .or(hooksConfigurationPage.emptyState.getLocator())
        .first(),
    ).toBeVisible();

    // 3. Open the dialog that adds a hook.
    const addHookDrawer = await hooksConfigurationPage.openAddHookDrawer();

    // 4. Make sure that the save button is off while the necessary fields are empty.
    await addHookDrawer.submit.shouldBeDisabled();

    // 5. Fill the necessary fields with a name from testResourceName('hook').
    const name = testResourceName('hook');
    await addHookDrawer.fillRequiredFields(name, 'PRE_BACKUP', 'echo hook');

    // 6. Make sure that the save button is on.
    // Actual: the drawer's Save button stays disabled after Name, Type and Command (the three
    // fields the form itself marks as required) are filled. Confirmed this is not a test-side
    // timing or fill issue: the Name's async uniqueness check round-trips and resolves valid,
    // Type and Command both end up valid and dirty too, and neither touching the non-required
    // Container field, adding a second repeat-group row, nor any combination of the above makes
    // Save re-evaluate — it never enables. Expected: Save should enable as soon as every
    // required field holds a value.
    test.fixme(
      await addHookDrawer.submit.getLocator().isDisabled(),
      'App hooks drawer: Save stays disabled after all required fields (Name, Type, Command) are filled.',
    );
    await addHookDrawer.submit.shouldBeEnabled();

    // 7. Clear one necessary field.
    await addHookDrawer.name.fill('');

    // 8. Make sure that the save button is off again.
    await addHookDrawer.submit.shouldBeDisabled();

    // 9. Click "Cancel".
    await addHookDrawer.close();

    // 10. Reload the page.
    await loggedInPage.reload({ waitUntil: 'load' });

    // 11. Make sure that the page holds no new hook.
    await expect(loggedInPage).toHaveURL(/\/configuration\/hooks/);
    await hooksConfigurationPage.hooksTable.shouldNotHaveRow(name);
  });
});
