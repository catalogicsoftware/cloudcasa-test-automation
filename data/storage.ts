import type {
  ListedAs,
  ProviderType,
  AzureCredentials,
  AzureTargetSpec,
  S3Credentials,
  S3StorageTarget,
  S3TargetSpec,
  StorageTargetCase,
  StorageTargetSpec,
} from '../types/data/storage';

const INVALID_CREDENTIALS = {
  accessKey: 'AKIAAQAINVALIDKEY0000',
  secretKey: 'aqa-invalid-secret-key-0000000000000000',
};

/** Hostname that resolves nowhere, so the backend probe fails on connectivity alone. */
export const unreachableTarget: S3StorageTarget = {
  provider: 'aws',
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
  provider: 'aws',
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

/**
 * Working S3 targets the happy-path test runs against — one generated test per
 * entry, so adding a target is a catalog entry plus a CI credential. Bucket,
 * endpoint and region live here rather than in the environment: all three are
 * asserted against the storage table, and endpoint handling is itself under
 * test (CC-659→663). Only the credential pair comes from the environment.
 */
export const s3TargetCatalog: S3TargetSpec[] = [
  {
    label: 'AWS S3',
    credentials: 'AWS',
    provider: 'aws',
    bucket: 'cloudcasa-staging-testbucket',
    endpoint: 'https://s3.amazonaws.com',
    region: 'us-east-1',
  },
  {
    label: 'DataCore',
    credentials: 'DATA_CORE',
    provider: 'aws',
    listedProvider: 'datacore',
    bucket: 'cc-dv-test',
    endpoint: 'https://catalogic-demo.cloud.datacore.com',
  },
];

/** Same rules as the S3 catalog: what the storage table asserts lives here, the service principal comes from the environment. */
export const azureTargetCatalog: AzureTargetSpec[] = [
  {
    label: 'Azure Blob',
    credentials: 'AZURE',
    provider: 'azure',
    resourceGroup: 'jgarner-rg',
    storageAccount: 'ccplaywright',
    region: 'East US',
    listedRegion: 'eastus',
  },
];

/** Splits a catalog into the entries the environment can run and the entries that must report a skip. */
const partitionByCredentials = <S, C>(
  catalog: S[],
  resolve: (spec: S) => C | undefined,
): { configured: (S & C)[]; unconfigured: S[] } => {
  const configured: (S & C)[] = [];
  const unconfigured: S[] = [];

  for (const spec of catalog) {
    const credentials = resolve(spec);
    if (credentials) {
      configured.push({ ...spec, ...credentials });
    } else {
      unconfigured.push(spec);
    }
  }

  return { configured, unconfigured };
};

/** A half-set credential group is a typo, not a target left unconfigured on purpose, so it must not read as a skip. */
const resolveGroup = <T extends Record<string, string>>(
  label: string,
  variables: { [K in keyof T]: string },
): T | undefined => {
  const resolved = Object.entries(variables).map(([key, variable]) => ({
    key,
    variable,
    value: process.env[variable],
  }));
  const missing = resolved.filter(entry => !entry.value);

  if (missing.length === resolved.length) {
    return undefined;
  }
  if (missing.length) {
    throw new Error(
      `Target "${label}" is half-configured: ${missing.map(entry => entry.variable).join(', ')} not set`,
    );
  }

  return Object.fromEntries(resolved.map(entry => [entry.key, entry.value])) as T;
};

const resolveS3Credentials = (spec: S3TargetSpec): S3Credentials | undefined =>
  resolveGroup<S3Credentials>(spec.label, {
    accessKey: `${spec.credentials}_ACCESS_KEY`,
    secretKey: `${spec.credentials}_SECRET_KEY`,
  });

const resolveAzureCredentials = (spec: AzureTargetSpec): AzureCredentials | undefined =>
  resolveGroup<AzureCredentials>(spec.label, {
    tenantId: `${spec.credentials}_TENANT_ID`,
    clientId: `${spec.credentials}_CLIENT_ID`,
    clientSecret: `${spec.credentials}_CLIENT_SECRET`,
    subscriptionId: `${spec.credentials}_SUBSCRIPTION_ID`,
  });

/** Every provider in one list, and both halves generate a test: missing credentials must surface as a skip, not as an absent test. */
export const objectStorageTargets = (): {
  configured: StorageTargetCase[];
  unconfigured: StorageTargetSpec[];
} => {
  const s3 = partitionByCredentials(s3TargetCatalog, resolveS3Credentials);
  const azure = partitionByCredentials(azureTargetCatalog, resolveAzureCredentials);

  return {
    configured: [...s3.configured, ...azure.configured],
    unconfigured: [...s3.unconfigured, ...azure.unconfigured],
  };
};

/** What the app is expected to show, which is not always what the wizard was filled with — every override is a measured value, never derived. */
export const listedAs = (
  target: ListedAs & { provider: ProviderType; region?: string },
): { provider: string; region?: string } => ({
  provider: target.listedProvider ?? target.provider,
  region: target.listedRegion ?? target.region,
});

/** Names the variables one entry is waiting for, for the skip reason. */
export const credentialVariables = (spec: StorageTargetSpec): string =>
  spec.provider === 'azure'
    ? ['TENANT_ID', 'CLIENT_ID', 'CLIENT_SECRET', 'SUBSCRIPTION_ID']
        .map(variable => `${spec.credentials}_${variable}`)
        .join('/')
    : `${spec.credentials}_ACCESS_KEY/${spec.credentials}_SECRET_KEY`;
