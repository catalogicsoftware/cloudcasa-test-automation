export type ObjectStore = {
  _id: string;
  _etag: string;
  name: string;
};

export type ObjectStoresListResponse = {
  _items: ObjectStore[];
};

/** What the Add object storage wizard POSTs for an S3-compatible target. */
export type CreateObjectStoreRequest = {
  name: string;
  private: boolean;
  provider_type: 'aws';
  skip_tls_certificate_validation: boolean;
  bucket_name: string;
  s3provider: {
    disable_default_integrity_checks: boolean;
    endpoint: string;
    credentials: { access_key: string; secret_key: string };
  };
};
