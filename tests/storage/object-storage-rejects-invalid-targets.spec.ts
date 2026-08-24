import { expect, test } from '@fixtures/auth';
import { acceptedEndpoints, CONNECTIVITY_ERROR, unreachableTarget } from '@data/storage';
import { testResourceName } from '@utils/resource-names';
import { STORAGE_TEST_TIMEOUT } from '@data/timeouts';

test.describe('Backup storage', () => {
  test.describe.configure({ timeout: STORAGE_TEST_TIMEOUT });

  test('Add object storage rejects an unreachable target with a connectivity error', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    storageConfigurationPage,
    toast,
  }) => {
    // Log in and navigate to /configuration/mystorage
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.topNavigationBar.goToConfiguration();
    await configurationPage.configurationSideBar.goTo('Storage');
    await storageConfigurationPage.shouldOpen();

    // Verify tabs Object storage / File storage and the table columns
    await storageConfigurationPage.objectStorageTab.shouldBeVisible();
    await storageConfigurationPage.fileStorageTab.shouldBeVisible();
    await storageConfigurationPage.shouldHaveObjectStorageColumns();

    // Open the wizard and verify its steps
    const addObjectWizard = await storageConfigurationPage.openAddObjectStorageWizard();
    await addObjectWizard.shouldHaveWizardSteps();
    await addObjectWizard.goToProviderStep();

    // Next stays disabled until bucket, endpoint and both keys are filled
    await addObjectWizard.next.shouldBeDisabled();
    await addObjectWizard.fillProvider(unreachableTarget);
    await addObjectWizard.next.shouldBeEnabled();

    // No endpoint shape is rejected client-side (CC-659→663)
    for (const endpoint of acceptedEndpoints) {
      await addObjectWizard.shouldAcceptEndpoint(endpoint);
    }

    // Back to the target under test: unreachable, but well-formed
    await addObjectWizard.endpointUrl.fill(unreachableTarget.endpoint);

    // The endpoint survives to the Summary step and is echoed back
    await addObjectWizard.goToSummaryStep();
    await addObjectWizard.shouldSummarizeEndpoint(unreachableTarget.endpoint);

    // Saving reaches the backend, which cannot connect to the endpoint
    const storageName = testResourceName('unreachable');
    const status = await addObjectWizard.saveExpectingRejection(storageName);
    expect(status, 'the backend must refuse an unreachable target').toBe(422);

    // The failure names the actual cause instead of a generic error (CC-763)
    await toast.shouldShowError(CONNECTIVITY_ERROR);

    // The failure is recoverable: the wizard stays open and nothing is retyped
    await addObjectWizard.shouldBeOpened();
    await addObjectWizard.back.click();
    await addObjectWizard.bucketName.shouldHaveValue(unreachableTarget.bucket);
    await addObjectWizard.endpointUrl.shouldHaveValue(unreachableTarget.endpoint);

    // A rejected target must not leave a half-created storage behind. Asserting on
    // this test's own name, not on the aqa- prefix: the happy-path test creates a
    // storage of its own and the suite runs fully parallel.
    await addObjectWizard.close();
    await loggedInPage.reload({ waitUntil: 'load' });
    await storageConfigurationPage.shouldOpen();
    await storageConfigurationPage.objectStoragesTable.shouldNotHaveRow(storageName);
  });
});
