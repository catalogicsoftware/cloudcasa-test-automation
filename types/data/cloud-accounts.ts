export type CloudProviderType = 'aws' | 'azure' | 'gcp';

export type CloudProviderCase = {
  type: CloudProviderType;
  /** Shown on the provider radio and echoed by the list's provider filter trigger. */
  label: string;
  /** Substring of the "linking process" hint the sidebar renders once this provider is selected. */
  linkingHint: string;
};
