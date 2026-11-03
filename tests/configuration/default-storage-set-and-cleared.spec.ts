import { expect, test } from '@fixtures/auth';
import { credentialVariables, objectStorageTargets } from '@data/storage';
import { BACKEND_PROBE_TIMEOUT, DEFAULT_STORAGE_TEST_TIMEOUT } from '@data/timeouts';
import { withExclusiveBucket } from '@utils/bucket-lock';
import { testResourceName, testResourceNamePattern } from '@utils/resource-names';
import type { S3TargetCase, StorageTargetCase } from '../../types/data/storage';

const isS3Target = (target: StorageTargetCase): target is S3TargetCase => target.provider === 'aws';

const { configured, unconfigured } = objectStorageTargets();
// DataCore needs no region, and ObjectStoresApi.create() sends none.
const s3Target = configured.filter(isS3Target).find(target => target.label === 'DataCore');
const missingS3Spec = unconfigured.find(spec => spec.label === 'DataCore');

test.describe('Configuration', () => {
  test.describe.configure({ timeout: DEFAULT_STORAGE_TEST_TIMEOUT });

  test('The default storage can be set and cleared', async ({
    // The preferences Save and the PUT in clearDefaultStorage() write the whole organization, name included.
    organizationNameLock,
    loggedInPage,
    dashboardPage,
    configurationPage,
    preferencesConfigurationPage,
    toast,
    createdObjectStorages,
    ccApi,
  }) => {
    test.skip(
      !s3Target,
      missingS3Spec
        ? `No credentials for ${missingS3Spec.label} — set ${credentialVariables(missingS3Spec)}`
        : 'No credentials for DataCore',
    );
    // The skip above already stopped execution for an unconfigured environment.
    const target = s3Target as S3TargetCase;
    const name = testResourceName('storage');
    const namePattern = testResourceNamePattern(name);

    // The bucket holds one storage at a time, and other storage tests use it too, so the whole journey holds its lock
    await withExclusiveBucket(target.bucket, async () => {
      // A default left by a crashed run blocks the stale-bucket sweep with a 422
      await ccApi.orgs.clearDefaultStorage();
      await ccApi.objectStores.deleteStaleForBucket(target.bucket);

      try {
        // Seed an object storage through the API with testResourceName('storage')
        createdObjectStorages.push(name);
        await ccApi.objectStores.create(name, target);

        // Log in as the admin user. Close the help modal
        await dashboardPage.userHelpModal.closeModal();

        // Open /configuration/preferences
        await dashboardPage.topNavigationBar.goToConfiguration();
        await configurationPage.configurationSideBar.goTo('Settings');
        await expect(loggedInPage).toHaveURL(/\/configuration\/preferences/);
        await expect(preferencesConfigurationPage.organizationName.getLocator()).not.toHaveValue(
          '',
        );

        // Select the seeded storage in "Default storage". Click "Save"
        await preferencesConfigurationPage.selectDefaultStorage(name, namePattern);
        await preferencesConfigurationPage.save();

        // Make sure that a success toast shows and that no error toast shows (CC-228: 422)
        await expect(toast.notifications.getLocator(), {
          message: 'No success notification matching /Updated preferences/i appeared',
        }).toContainText(/Updated preferences/i, { timeout: BACKEND_PROBE_TIMEOUT });
        await expect(toast.errorIcons.getLocator()).toHaveCount(0);

        // Reload. Make sure that "Default storage" holds the seeded storage
        await loggedInPage.reload({ waitUntil: 'load' });
        await expect(loggedInPage).toHaveURL(/\/configuration\/preferences/);
        await expect(preferencesConfigurationPage.organizationName.getLocator()).not.toHaveValue(
          '',
        );
        await expect(preferencesConfigurationPage.defaultStorage.getLocator()).toHaveText(
          namePattern,
        );

        // Clear the dropdown with its clear button. Click "Save"
        await preferencesConfigurationPage.clearDefaultStorage();
        await preferencesConfigurationPage.save();
        await expect(toast.notifications.getLocator(), {
          message: 'No success notification matching /Updated preferences/i appeared',
        }).toContainText(/Updated preferences/i, { timeout: BACKEND_PROBE_TIMEOUT });
        await expect(toast.errorIcons.getLocator()).toHaveCount(0);

        // Reload. Make sure that "Default storage" is empty (CC-133)
        await loggedInPage.reload({ waitUntil: 'load' });
        await expect(loggedInPage).toHaveURL(/\/configuration\/preferences/);
        await expect(preferencesConfigurationPage.organizationName.getLocator()).not.toHaveValue(
          '',
        );
        await expect(preferencesConfigurationPage.defaultStorage.getLocator()).toHaveText(/^\s*$/);
      } finally {
        // Clear the default storage through the API. Then delete the storage, while the bucket lock is still held
        await ccApi.orgs.clearDefaultStorage();
        await ccApi.objectStores.deleteByName(name);
      }
    });
  });
});
