import { expect, test } from '@fixtures/auth';
import {
  acceptedEndpoints,
  CONNECTIVITY_ERROR,
  fakeStorageName,
  unreachableTarget,
} from '@data/storage';

test.describe('Backup storage', () => {
  test('Add object storage rejects an unreachable target with a connectivity error', async ({
    loggedInPage,
    dashboardPage,
    storageConfigurationPage,
    toast,
  }) => {
    // The backend probes the endpoint before answering, which the default 120s
    // barely covers once the wizard walk-through is added.
    test.setTimeout(240000);

    // Log in and navigate to /configuration/mystorage
    await dashboardPage.userHelpModal.closeModal();
    await loggedInPage.goto('/configuration/mystorage', { waitUntil: 'load' });
    await storageConfigurationPage.shouldOpen();

    // Verify tabs Object storage / File storage and the table columns
    await storageConfigurationPage.objectStorageTab.shouldBeVisible();
    await storageConfigurationPage.fileStorageTab.shouldBeVisible();
    await storageConfigurationPage.shouldHaveObjectStorageColumns();

    // Open the wizard and verify its steps
    const wizard = await storageConfigurationPage.openAddObjectStorageWizard();
    await wizard.shouldHaveWizardSteps();
    await wizard.goToProviderStep();

    // Next stays disabled until bucket, endpoint and both keys are filled
    await wizard.next.shouldBeDisabled();
    await wizard.fillProvider(unreachableTarget);
    await wizard.next.shouldBeEnabled();

    // No endpoint shape is rejected client-side (CC-659→663)
    for (const endpoint of acceptedEndpoints) {
      await wizard.shouldAcceptEndpoint(endpoint);
    }

    // Back to the target under test: unreachable, but well-formed
    await wizard.endpointUrl.fill(unreachableTarget.endpoint);

    // The endpoint survives to the Summary step and is echoed back
    await wizard.goToSummaryStep();
    await wizard.shouldSummarizeEndpoint(unreachableTarget.endpoint);

    // Saving reaches the backend, which cannot connect to the endpoint
    const status = await wizard.saveExpectingRejection(fakeStorageName());
    expect(status, 'the backend must refuse an unreachable target').toBe(422);

    // The failure names the actual cause instead of a generic error (CC-763)
    await toast.shouldShowError(CONNECTIVITY_ERROR);

    // The failure is recoverable: the wizard stays open and nothing is retyped
    await wizard.shouldBeOpened();
    await wizard.back.click();
    await wizard.bucketName.shouldHaveValue(unreachableTarget.bucket);
    await wizard.endpointUrl.shouldHaveValue(unreachableTarget.endpoint);

    // A rejected target must not leave a half-created storage behind
    await wizard.close();
    await loggedInPage.reload({ waitUntil: 'load' });
    await storageConfigurationPage.shouldOpen();
    await storageConfigurationPage.objectStoragesTable.shouldNotHaveRow(/^aqa-/);
  });
});
