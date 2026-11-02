import { expect, test } from '@fixtures/auth';
import { ORGANIZATION_SETTING_TEST_TIMEOUT } from '@data/timeouts';

test.describe('Configuration', () => {
  test.describe.configure({ timeout: ORGANIZATION_SETTING_TEST_TIMEOUT });

  test('An organization setting stays after a reload', async ({
    originalYamlCatalogForBrowse,
    loggedInPage,
    dashboardPage,
    configurationPage,
    policiesConfigurationPage,
    preferencesConfigurationPage,
    toast,
  }) => {
    const { organizationName, yamlCatalogForBrowse } = preferencesConfigurationPage;
    const { configurationSideBar } = configurationPage;

    // 1. Log in as the admin user and open /configuration/preferences.
    await dashboardPage.userHelpModal.closeModal();
    await preferencesConfigurationPage.goto('/configuration/preferences');
    await expect(loggedInPage).toHaveURL(/\/configuration\/preferences/);

    // 2. Make sure that the form shows its current values.
    await preferencesConfigurationPage.preferencesContainer.shouldBeVisible();
    await expect(organizationName.getLocator()).toHaveValue(/\S/);
    await expect(yamlCatalogForBrowse.getLocator()).toBeChecked({
      checked: originalYamlCatalogForBrowse,
    });

    // 3. Read the value of the setting that the test changes.
    const originalValue = await yamlCatalogForBrowse.getLocator().isChecked();
    const newValue = !originalValue;

    // 4. Change that setting to a different value.
    await yamlCatalogForBrowse.click();
    await expect(yamlCatalogForBrowse.getLocator()).toBeChecked({ checked: newValue });

    // 5. Save the form.
    await preferencesConfigurationPage.save();

    // 6. Make sure that a success toast appears.
    await toast.shouldShowSuccess(/Updated preferences/);

    // 7. Reload the page.
    await loggedInPage.reload({ waitUntil: 'load' });

    // 8. Make sure that the form shows the new value.
    await expect(organizationName.getLocator()).toHaveValue(/\S/);
    await expect(yamlCatalogForBrowse.getLocator()).toBeChecked({ checked: newValue });

    // 9. Open another page and come back to /configuration/preferences.
    await configurationSideBar.goTo('Policies');
    await policiesConfigurationPage.shouldOpen();
    await configurationSideBar.goTo('Settings');
    await expect(loggedInPage).toHaveURL(/\/configuration\/preferences/);

    // 10. Make sure that the new value stays.
    await expect(organizationName.getLocator()).toHaveValue(/\S/);
    await expect(yamlCatalogForBrowse.getLocator()).toBeChecked({ checked: newValue });

    // 11. Set the value of the step 3 back and save.
    await yamlCatalogForBrowse.click();
    await preferencesConfigurationPage.save();
    await toast.shouldShowSuccess(/Updated preferences/);

    // 12. Make sure that the first value is in the form again.
    await loggedInPage.reload({ waitUntil: 'load' });
    await expect(organizationName.getLocator()).toHaveValue(/\S/);
    await expect(yamlCatalogForBrowse.getLocator()).toBeChecked({ checked: originalValue });
  });
});
