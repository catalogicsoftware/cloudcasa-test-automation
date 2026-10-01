// spec: spec/configuration/cloud-accounts-misc.md (TC-CA-001, TC-CA-002)

import { test } from '@fixtures/auth';
import { CLOUD_PROVIDERS } from '@data/cloud-accounts';

test.describe('Cloud Accounts', () => {
  test('The cloud account dialog asks for the fields of each provider', async ({
    loggedInPage,
    dashboardPage,
    cloudAccountsConfigurationPage,
  }) => {
    // 1. Log in as the admin user.
    await dashboardPage.userHelpModal.closeModal();

    // 2. Open /configuration/cloud-accounts?provider_type=aws.
    // 3. Make sure that the provider filter holds the value AWS.
    // 4. Do the step 2 and the step 3 again for azure and for gcp.
    for (const provider of CLOUD_PROVIDERS) {
      await loggedInPage.goto(`/configuration/cloud-accounts?provider_type=${provider.type}`, {
        waitUntil: 'load',
      });
      await cloudAccountsConfigurationPage.shouldOpen();
      await cloudAccountsConfigurationPage.shouldFilterByProvider(provider.type);
    }

    // 5. Clear the filter.
    await cloudAccountsConfigurationPage.clearProviderFilter();
    const accountCountBeforeDialog = await cloudAccountsConfigurationPage.accountsTable.rowCount();

    // 6. Click "Add cloud account".
    const dialog = await cloudAccountsConfigurationPage.openAddCloudAccountDialog();

    // 7. Make sure that the dialog offers AWS, Azure and GCP.
    await dialog.shouldOfferEveryProvider();

    // 8. Select AWS and make sure that the AWS fields are visible.
    await dialog.selectProvider('aws');
    await dialog.shouldShowFieldsOf('aws');

    // 9. Make sure that the submit is off while the necessary fields are empty.
    await dialog.submit.shouldBeDisabled();

    // 10. Select Azure and make sure that the Azure fields replace the AWS fields.
    await dialog.selectProvider('azure');
    await dialog.shouldShowFieldsOf('azure');
    await dialog.submit.shouldBeDisabled();

    // 11. Select GCP and make sure that the GCP fields are visible.
    await dialog.selectProvider('gcp');
    await dialog.shouldShowFieldsOf('gcp');
    await dialog.submit.shouldBeDisabled();

    // 12. Click "Cancel".
    await dialog.close();

    // 13. Reload the page.
    await cloudAccountsConfigurationPage.reloadPage();
    await cloudAccountsConfigurationPage.shouldOpen();

    // 14. Make sure that the table holds no new account.
    await cloudAccountsConfigurationPage.accountsTable.shouldHaveRowCount(accountCountBeforeDialog);
  });
});
