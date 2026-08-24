/** Radio value on the wizard's Provider step — every S3-compatible target picks `aws`. */
export type ProviderType = 'aws' | 'azure';

/** Resolved from `<credentials>_ACCESS_KEY` / `<credentials>_SECRET_KEY`. */
export type S3Credentials = {
  accessKey: string;
  secretKey: string;
};

export type S3StorageTarget = S3Credentials &
  ListedAs & {
    provider: 'aws';
    bucket: string;
    endpoint: string;
    /** Only AWS endpoints need it — the form turns Region into a mandatory select. */
    region?: string;
  };

/** What every catalog entry declares on top of its provider fields. */
export type TargetCatalogEntry = {
  /** Names the generated test and the storage it creates. */
  label: string;
  /** Environment prefix of the credentials. */
  credentials: string;
};

/** What the app echoes back where it differs from what the wizard was filled with. */
type ListedAs = {
  /** Provider cell when the backend classifies the target as its own type (e.g. DataCore behind the aws radio). */
  listedProvider?: string;
  /** Region as the backend normalises it (e.g. "East US" selected, "eastus" echoed). */
  listedRegion?: string;
};

/** A catalog entry: everything except the credential pair, which comes from the environment. */
export type S3TargetSpec = Omit<S3StorageTarget, keyof S3Credentials> & TargetCatalogEntry;

/** A catalog entry whose credentials were found in the environment. */
export type S3TargetCase = S3TargetSpec & S3Credentials;

/** From `<credentials>_TENANT_ID` / `_CLIENT_ID` / `_CLIENT_SECRET` / `_SUBSCRIPTION_ID` — the subscription id identifies the account, so it stays out of the catalog. */
export type AzureCredentials = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
};

/** The form asks for no container: the storage account inside its resource group is the whole target. */
export type AzureStorageTarget = AzureCredentials &
  ListedAs & {
    provider: 'azure';
    /** Only when the case needs Government — the form preselects Public. */
    cloud?: 'Public' | 'Government';
    resourceGroup: string;
    storageAccount: string;
    region: string;
  };

export type AzureTargetSpec = Omit<AzureStorageTarget, keyof AzureCredentials> & TargetCatalogEntry;

export type AzureTargetCase = AzureTargetSpec & AzureCredentials;

/** What the wizard fills, what the catalog declares and what a runnable case holds. */
export type StorageTarget = S3StorageTarget | AzureStorageTarget;
export type StorageTargetSpec = S3TargetSpec | AzureTargetSpec;
export type StorageTargetCase = S3TargetCase | AzureTargetCase;
