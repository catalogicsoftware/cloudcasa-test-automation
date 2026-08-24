import { expect, test } from '@fixtures/auth';
import { CREDENTIALS_ERROR, deniedCredentialsTarget } from '@data/storage';
import { testResourceName } from '@utils/resource-names';
import { STORAGE_TEST_TIMEOUT } from '@data/timeouts';

test.describe('Backup storage', () => {
  test.describe.configure({ timeout: STORAGE_TEST_TIMEOUT });

  test('Add object storage tells a credentials failure apart from a connectivity one', async ({
    loggedInPage,
    dashboardPage,
    storageConfigurationPage,
    toast,
  }) => {
    // Log in and navigate to /configuration/mystorage
    await dashboardPage.userHelpModal.closeModal();
    await loggedInPage.goto('/configuration/mystorage', { waitUntil: 'load' });
    await storageConfigurationPage.shouldOpen();

    // Fill the wizard with a reachable endpoint and credentials that cannot access it
    const wizard = await storageConfigurationPage.openAddObjectStorageWizard();
    await wizard.goToProviderStep();
    await wizard.fillProvider(deniedCredentialsTarget);
    await wizard.goToSummaryStep();

    // The backend refuses the target
    const status = await wizard.saveExpectingRejection(testResourceName('denied-credentials'));
    expect(status, 'the backend must refuse unusable credentials').toBe(422);

    // The message points at credentials, not at connectivity (CC-763)
    await toast.shouldShowError(CREDENTIALS_ERROR);
  });
});
