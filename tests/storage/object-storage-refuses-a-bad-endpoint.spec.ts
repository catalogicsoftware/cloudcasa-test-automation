import { expect, test } from '@fixtures/auth';
import { acceptedEndpoints, unreachableTarget } from '@data/storage';
import { testResourceName } from '@utils/resource-names';
import { STORAGE_TEST_TIMEOUT } from '@data/timeouts';

test.describe('Backup Storage', () => {
  test.describe.configure({ timeout: STORAGE_TEST_TIMEOUT });

  test('The wizard refuses a bad endpoint URL and accepts a good one', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    storageConfigurationPage,
  }) => {
    // Defect (CC-659→663): actual — the Endpoint URL field never shows a validation message and "Next" stays enabled for non-URL text; expected — a validation message appears and "Next" is disabled until the value is a valid URL.
    test.fixme();

    // Log in as the admin user and open /configuration/mystorage
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.topNavigationBar.goToConfiguration();
    await configurationPage.configurationSideBar.goTo('Storage');
    await storageConfigurationPage.shouldOpen();

    // Click "Add storage"
    const addObjectWizard = await storageConfigurationPage.openAddObjectStorageWizard();

    // Keep the answer "No" on the step General, click "Next"
    await addObjectWizard.goToProviderStep();

    // Fill a bucket name, an access key and a secret key on the step Provider
    await addObjectWizard.bucketName.fill(unreachableTarget.bucket);
    await addObjectWizard.accessKey.fill(unreachableTarget.accessKey, { secret: true });
    await addObjectWizard.secretKey.fill(unreachableTarget.secretKey, { secret: true });

    // Fill the endpoint field with text that holds a space
    await addObjectWizard.endpointUrl.fill('https://s3 example.com');

    // The field should show a validation message
    await addObjectWizard.endpointValidationMessage.shouldBeVisible();

    // The button "Next" should be off
    await addObjectWizard.next.shouldBeDisabled();

    // Fill the endpoint field with text that has no host
    await addObjectWizard.endpointUrl.fill('https://');

    // The field should show a validation message again
    await addObjectWizard.endpointValidationMessage.shouldBeVisible();

    // Fill the endpoint field with a good value from the accepted-formats catalog
    const goodEndpoint = acceptedEndpoints[0];
    await addObjectWizard.endpointUrl.fill(goodEndpoint);

    // The validation message should go away
    await expect(addObjectWizard.endpointValidationMessage.getLocator()).toBeHidden();

    // The button "Next" should be on
    await addObjectWizard.next.shouldBeEnabled();

    // Go to the step Summary
    await addObjectWizard.goToSummaryStep();

    // The summary should show the endpoint filled on the previous step
    await addObjectWizard.shouldSummarizeEndpoint(goodEndpoint);

    // Name the storage so its absence can be verified after the cancel
    const storageName = testResourceName('bad-endpoint');
    await addObjectWizard.storageName.fill(storageName);

    // Close the wizard with the cancel action
    await addObjectWizard.close();

    // The table should hold no new storage
    await loggedInPage.reload({ waitUntil: 'load' });
    await storageConfigurationPage.shouldOpen();
    await storageConfigurationPage.objectStoragesTable.shouldNotHaveRow(storageName);
  });
});
