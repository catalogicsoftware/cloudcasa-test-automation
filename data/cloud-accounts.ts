import type { CloudProviderCase, CloudProviderType } from '../types/data/cloud-accounts';

/**
 * The Add Cloud Account dialog renders the same Name/Description/tags fields for every
 * provider — only this hint (about the resource the next step will ask CloudFormation/ARM/
 * Cloud Shell to create) changes when the provider radio is switched.
 */
export const CLOUD_PROVIDERS: CloudProviderCase[] = [
  { type: 'aws', label: 'Amazon Web Services', linkingHint: 'CloudFormation stack' },
  { type: 'azure', label: 'Microsoft Azure', linkingHint: 'ARM template' },
  { type: 'gcp', label: 'Google Cloud', linkingHint: 'Google Cloud Shell' },
];

export const cloudProviderCase = (type: CloudProviderType): CloudProviderCase => {
  const provider = CLOUD_PROVIDERS.find(candidate => candidate.type === type);
  if (!provider) {
    throw new Error(`Unknown cloud provider "${type}"`);
  }
  return provider;
};
