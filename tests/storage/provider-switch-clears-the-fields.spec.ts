import { expect, test } from '@fixtures/auth';
import { credentialVariables, objectStorageTargets } from '@data/storage';
import { testResourceName } from '@utils/resource-names';
import { STORAGE_TEST_TIMEOUT } from '@data/timeouts';
import { withExclusiveBucket } from '@utils/bucket-lock';
import type { S3TargetCase, StorageTargetCase } from '../../types/data/storage';

const isS3Target = (target: StorageTargetCase): target is S3TargetCase => target.provider === 'aws';

const { configured, unconfigured } = objectStorageTargets();
// DataCore needs no Region step, which keeps this test focused on the field set the
// provider switch renders rather than on the AWS-only region widget (see CC-659→663).
const s3Target = configured.filter(isS3Target).find(target => target.label === 'DataCore');
const missingS3Spec = unconfigured.find(spec => spec.label === 'DataCore');

test.describe('Backup Storage', () => {
  test.describe.configure({ timeout: STORAGE_TEST_TIMEOUT });

  test('The provider switch does not keep old values', async ({
    loggedInPage,
    dashboardPage,
    storageConfigurationPage,
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

    // This target's bucket is shared with the happy-path case in adds-object-storage.spec.ts —
    // the stale-bucket sweep and the backend's bucket-uniqueness constraint both make
    // concurrent access unsafe under the fullyParallel suite, so the two runs are serialized.
    await withExclusiveBucket(target.bucket, async () => {
      // One bucket holds one storage, so a leftover from a crashed run would 422 this one
      await ccApi.objectStores.deleteStaleForBucket(target.bucket);

      // Log in as the admin user and open /configuration/mystorage
      await dashboardPage.userHelpModal.closeModal();
      await loggedInPage.goto('/configuration/mystorage', { waitUntil: 'load' });
      await storageConfigurationPage.shouldOpen();

      // Open the wizard and go to the step Provider
      const wizard = await storageConfigurationPage.openAddObjectStorageWizard();
      await wizard.goToProviderStep();

      // Select the provider "AWS / S3 (compatible)"
      await wizard.selectProviderType('aws');

      // Fill the bucket name, the endpoint, the access key and the secret key
      await wizard.bucketName.fill(target.bucket);
      await wizard.endpointUrl.fill(target.endpoint);
      await wizard.accessKey.fill(target.accessKey, { secret: true });
      await wizard.secretKey.fill(target.secretKey, { secret: true });

      // Select the provider "Azure"
      await wizard.selectProviderType('azure');

      // Make sure that the S3 fields are not visible
      await expect(wizard.bucketName.getLocator()).toBeHidden();
      await expect(wizard.endpointUrl.getLocator()).toBeHidden();
      await expect(wizard.accessKey.getLocator()).toBeHidden();
      await expect(wizard.secretKey.getLocator()).toBeHidden();

      // Make sure that the Azure fields are visible
      await wizard.resourceGroup.shouldBeVisible();
      await wizard.storageAccountName.shouldBeVisible();

      // Make sure that the button "Next" is off while the Azure fields are empty
      await wizard.next.shouldBeDisabled();

      // Select the provider "AWS / S3 (compatible)" again
      await wizard.selectProviderType('aws');
      await wizard.bucketName.shouldBeVisible();

      // Make sure that no field holds a value of the Azure form
      await wizard.bucketName.shouldHaveValue('');
      await wizard.endpointUrl.shouldHaveValue('');
      await wizard.accessKey.shouldHaveValue('', { secret: true });
      await wizard.secretKey.shouldHaveValue('', { secret: true });

      // Make sure that the validation state is correct for the S3 form
      await wizard.next.shouldBeDisabled();

      // Fill the S3 fields again and go to the step Summary
      await wizard.bucketName.fill(target.bucket);
      await wizard.endpointUrl.fill(target.endpoint);
      await wizard.accessKey.fill(target.accessKey, { secret: true });
      await wizard.secretKey.fill(target.secretKey, { secret: true });
      await wizard.goToSummaryStep();

      // Make sure that the summary names the provider S3 only
      await wizard.shouldSummarizeTarget(target);
      await expect(wizard.container.getLocator()).not.toContainText('Azure');

      // Push the name to the fixture createdObjectStorages before the save
      const name = testResourceName(target.label);
      createdObjectStorages.push(name);

      // Save the storage
      await wizard.save(name);

      // Make sure that the table row shows the provider and the bucket of the step 12
      await storageConfigurationPage.shouldListObjectStorage(name, target);
    });
  });
});
