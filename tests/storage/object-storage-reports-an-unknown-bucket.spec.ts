import { expect, test } from '@fixtures/auth';
import { BUCKET_ERROR, CONNECTIVITY_ERROR, CREDENTIALS_ERROR, objectStorageTargets } from '@data/storage';
import { testResourceName } from '@utils/resource-names';
import { STORAGE_TEST_TIMEOUT } from '@data/timeouts';
import type { S3TargetCase } from '../../types/data/storage';

const isAwsS3 = (target: { label: string; provider: string }): target is S3TargetCase =>
  target.label === 'AWS S3' && target.provider === 'aws';

const goodTarget = objectStorageTargets().configured.find(isAwsS3);

test.describe('Backup Storage', () => {
  test.describe.configure({ timeout: STORAGE_TEST_TIMEOUT });

  test('A storage with an unknown bucket gives a bucket error', async ({
    loggedInPage,
    dashboardPage,
    storageConfigurationPage,
    toast,
    createdObjectStorages,
    ccApi,
  }) => {
    test.skip(!goodTarget, 'No credentials for AWS S3 — set AWS_ACCESS_KEY/AWS_SECRET_KEY');
    const target = goodTarget!;

    // One bucket holds one storage, so a leftover from a crashed run would 422 the final save
    await ccApi.objectStores.deleteStaleForBucket(target.bucket);

    // Log in and navigate to /configuration/mystorage
    await dashboardPage.userHelpModal.closeModal();
    await loggedInPage.goto('/configuration/mystorage', { waitUntil: 'load' });
    await storageConfigurationPage.shouldOpen();

    // Open the wizard and go to the step Provider
    const wizard = await storageConfigurationPage.openAddObjectStorageWizard();
    await wizard.goToProviderStep();

    // Fill the good endpoint and the good credentials, but a bucket name that does not exist
    const unknownBucket = testResourceName('bucket');
    await wizard.fillProvider({ ...target, bucket: unknownBucket });

    // Go to the step Summary and save
    await wizard.goToSummaryStep();
    const name = testResourceName('unknown-bucket');
    const status = await wizard.saveExpectingRejection(name);
    expect(status, 'the backend must refuse an unknown bucket').toBe(422);

    // The message names the bucket as the cause (CC-763), not a general error or the credentials message
    await toast.shouldShowError(BUCKET_ERROR);
    const toastText = await toast.notifications.getLocator().innerText();
    expect(toastText, 'must not be the connectivity message').not.toMatch(CONNECTIVITY_ERROR);
    expect(toastText, 'must not be the credentials message').not.toMatch(CREDENTIALS_ERROR);

    // The wizard stays open and the fields keep their values
    await wizard.shouldBeOpened();
    await wizard.storageName.shouldHaveValue(name);
    await wizard.back.click();
    await wizard.bucketName.shouldHaveValue(unknownBucket);
    await wizard.endpointUrl.shouldHaveValue(target.endpoint);

    // Correct the bucket name to the good bucket and save again
    await wizard.bucketName.fill(target.bucket);
    await wizard.goToSummaryStep();
    createdObjectStorages.push(name);
    await wizard.save(name);

    // The storage goes to the table
    const nameMatcher = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    await storageConfigurationPage.shouldListObjectStorage(nameMatcher, target);
  });
});
