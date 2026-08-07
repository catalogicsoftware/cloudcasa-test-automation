import type { S3StorageTarget } from '../types/data/storage';

const INVALID_CREDENTIALS = {
  accessKey: 'AKIAAQAINVALIDKEY0000',
  secretKey: 'aqa-invalid-secret-key-0000000000000000',
};

export const fakeStorageName = (): string => `aqa-storage-${Date.now()}`;

/** Hostname that resolves nowhere, so the backend probe fails on connectivity alone. */
export const unreachableTarget: S3StorageTarget = {
  bucket: 'aqa-unreachable-bucket',
  endpoint: 'https://s3.aqa-invalid.example.com:9000',
  ...INVALID_CREDENTIALS,
};

/**
 * Reachable S3-compatible endpoint, so the probe gets far enough to fail on
 * credentials. Google's endpoint is used deliberately: an AWS one turns Region
 * into a required select and would change the form's gating.
 */
export const deniedCredentialsTarget: S3StorageTarget = {
  bucket: 'aqa-nonexistent-bucket-19283746',
  endpoint: 'https://storage.googleapis.com',
  ...INVALID_CREDENTIALS,
};

export const CONNECTIVITY_ERROR = /Could not connect to the endpoint URL/i;
export const CREDENTIALS_ERROR = /credentials and permissions/i;

/**
 * Endpoint shapes the GUI rejected while the same bucket worked from the MinIO
 * client (CC-659→663). All non-AWS hosts on purpose — see deniedCredentialsTarget.
 */
export const acceptedEndpoints: string[] = [
  's3.example.com',
  'https://s3.example.com',
  'http://s3.example.com',
  'https://s3.example.com:9000',
  'https://s3.example.com:9000/',
  'https://192.168.1.10:9000',
];
