import { expect, test } from '@fixtures/auth';
import { API_KEY_ROLE, apiKeyQuotaText, createdOn, maskedApiKey } from '@data/api-keys';
import { API_KEY_TEST_TIMEOUT } from '@data/timeouts';
import { testResourceName, testResourceNamePattern } from '@utils/resource-names';

test.describe('Organization', () => {
  test.describe.configure({ timeout: API_KEY_TEST_TIMEOUT });

  test('The user makes an API key and deletes it', async ({
    loggedInPage,
    dashboardPage,
    apiKeysConfigurationPage,
    apiKeysApi,
    createdApiKeys,
  }) => {
    // 1. Log in as the admin user and open /configuration/api-keys.
    await dashboardPage.userHelpModal.closeModal();
    await apiKeysConfigurationPage.open();
    await expect(loggedInPage).toHaveURL(/\/configuration\/api-keys/);
    await apiKeysConfigurationPage.heading.shouldBeVisible();

    // 2. Read the quota heading. The heading has the form "API keys N of M created".
    const quotaBefore = await apiKeysConfigurationPage.readQuota();

    // 3. Click "New API key".
    const drawer = await apiKeysConfigurationPage.openNewApiKeyDrawer();
    await drawer.name.shouldBeVisible();

    // 4. Make a name with testResourceName('key') and fill it.
    const name = testResourceName('key');
    const namePattern = testResourceNamePattern(name);
    await drawer.name.fill(name, { validateValue: true });

    // 5. Select a role and save.
    await drawer.roles.selectByText(API_KEY_ROLE);
    await drawer.roles.shouldHaveSelected(API_KEY_ROLE);
    // Registered before the save so teardown owns the key even if a later step fails.
    createdApiKeys.push(name);
    await drawer.generate();

    // 6. Make sure that the application shows the secret one time.
    await drawer.copyHint.shouldHaveText('It will not be displayed once you leave this page');
    await drawer.secret.shouldBeVisible();

    // 7. Copy the secret value.
    const secret = await drawer.copySecret();
    await expect(drawer.secret.getLocator()).toHaveText(secret);
    await drawer.closeDrawer.click();
    await expect(drawer.name.getLocator()).toHaveCount(0);
    // Leaving the drawer hides the secret for good: the key's own drawer does not show it again.
    const reopened = await apiKeysConfigurationPage.openApiKey(namePattern);
    await reopened.name.shouldBeVisible();
    await expect(reopened.secret.getLocator()).toHaveCount(0);
    await reopened.close();
    await expect(reopened.name.getLocator()).toHaveCount(0);

    // 8. Make sure that the table holds the key with its name, role and creation time.
    const { apiKeysTable } = apiKeysConfigurationPage;
    await apiKeysTable.shouldHaveRow(namePattern);
    await apiKeysTable.shouldHaveCellValue(namePattern, 'Name', namePattern);
    await apiKeysTable.shouldHaveCellValue(namePattern, 'Roles', API_KEY_ROLE);
    await apiKeysTable.shouldHaveCellValue(namePattern, 'Created', createdOn(new Date()));
    await apiKeysTable.shouldHaveCellValue(namePattern, 'API key', maskedApiKey(secret));

    // 9. Make sure that the quota heading shows one more key.
    const { quota } = apiKeysConfigurationPage;
    await expect(quota.getLocator()).toHaveText(
      apiKeyQuotaText({ ...quotaBefore, created: quotaBefore.created + 1 }),
    );

    // 10. Send one API request with the new key.
    const status = await apiKeysApi.statusWithKey(secret);

    // 11. Make sure that the API accepts the key.
    expect(status).toBe(200);

    // 12. Delete the key in the user interface and confirm the deletion.
    const confirmation = await apiKeysConfigurationPage.startRemovingKey(namePattern);
    await confirmation.panel.shouldBeVisible();
    await confirmation.confirm();

    // 13. Make sure that the row is not in the table.
    await apiKeysTable.shouldNotHaveRow(namePattern);

    // 14. Make sure that the quota heading shows one key less.
    await expect(quota.getLocator()).toHaveText(apiKeyQuotaText(quotaBefore));
    await loggedInPage.reload({ waitUntil: 'load' });
    await expect(loggedInPage).toHaveURL(/\/configuration\/api-keys/);
    await apiKeysConfigurationPage.heading.shouldBeVisible();
    await apiKeysTable.shouldNotHaveRow(namePattern);
    await expect(quota.getLocator()).toHaveText(apiKeyQuotaText(quotaBefore));
  });
});
