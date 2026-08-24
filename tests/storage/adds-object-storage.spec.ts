import { test } from '@fixtures/auth';
import { credentialVariables, objectStorageTargets } from '@data/storage';
import { testResourceName } from '@utils/resource-names';
import { STORAGE_TEST_TIMEOUT } from '@data/timeouts';

const { configured, unconfigured } = objectStorageTargets();

test.describe('Backup storage', () => {
  test.describe.configure({ timeout: STORAGE_TEST_TIMEOUT });

  for (const target of configured) {
    test(`Add ${target.label} object storage succeeds end-to-end`, async ({
      loggedInPage,
      dashboardPage,
      configurationPage,
      storageConfigurationPage,
      createdObjectStorages,
      ccApi,
    }) => {
      const name = testResourceName(target.label);

      // One bucket holds one storage, so a leftover from a crashed run would 422 this one — Azure has no bucket to sweep
      if (target.provider !== 'azure') {
        await ccApi.objectStores.deleteStaleForBucket(target.bucket);
      }

      // Log in and navigate to /configuration/mystorage
      await dashboardPage.userHelpModal.closeModal();
      await dashboardPage.topNavigationBar.goToConfiguration();
      await configurationPage.configurationSideBar.goTo('Storage');
      await storageConfigurationPage.shouldOpen();

      // Complete the wizard: General (not isolated) -> Provider -> Summary
      const wizard = await storageConfigurationPage.openAddObjectStorageWizard();
      await wizard.goToProviderStep();
      await wizard.fillProvider(target);
      await wizard.goToSummaryStep();
      await wizard.shouldSummarizeTarget(target);

      // Registered before the save so teardown owns the storage even if a later assertion fails
      createdObjectStorages.push(name);

      // Save. A 2xx is the backend reporting it reached the target with these
      // credentials — the same call answers 422 for a bad one (CC-763).
      await wizard.save(name);

      // The storage is listed with the details entered in the wizard
      await storageConfigurationPage.shouldListObjectStorage(name, target);

      // It is persisted, not just appended to the client-side list
      await loggedInPage.reload({ waitUntil: 'load' });
      await storageConfigurationPage.shouldOpen();
      await storageConfigurationPage.shouldListObjectStorage(name, target);

      // Removing it takes a confirmation naming the storage, and leaves no orphan row
      await storageConfigurationPage.removeObjectStorage(name);
      await loggedInPage.reload({ waitUntil: 'load' });
      await storageConfigurationPage.shouldOpen();
      await storageConfigurationPage.objectStoragesTable.shouldNotHaveRow(name);
    });
  }

  // A catalog entry whose credentials are not in the environment still reports itself, as a skip.
  for (const spec of unconfigured) {
    test(`Add ${spec.label} object storage succeeds end-to-end`, () => {
      test.skip(true, `No credentials for ${spec.label} — set ${credentialVariables(spec)}`);
    });
  }
});
