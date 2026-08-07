export type S3StorageTarget = {
  bucket: string;
  endpoint: string;
  accessKey: string;
  secretKey: string;
  /** Only AWS endpoints need it — the form turns Region into a mandatory select. */
  region?: string;
};
