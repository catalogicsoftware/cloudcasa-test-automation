import { APIRequestContext } from '@playwright/test';
import type { ImageReference } from './image-reference';

// docker.io is the only registry whose v2 API host differs from its image-reference host.
const REGISTRY_API_HOSTS: Record<string, string> = {
  'docker.io': 'registry-1.docker.io',
};

const MANIFEST_ACCEPT_HEADER = [
  'application/vnd.docker.distribution.manifest.v2+json',
  'application/vnd.docker.distribution.manifest.list.v2+json',
  'application/vnd.oci.image.manifest.v1+json',
  'application/vnd.oci.image.index.v1+json',
].join(',');

/**
 * Checks whether the registry's manifest endpoint resolves the tag (CC-811: a stale tag 404s
 * here), following the standard Docker Registry HTTP API v2 anonymous-token challenge.
 */
export async function registryHasTag(
  request: APIRequestContext,
  { registry, repository, tag }: ImageReference,
): Promise<boolean> {
  const apiHost = REGISTRY_API_HOSTS[registry] ?? registry;
  const manifestUrl = `https://${apiHost}/v2/${repository}/manifests/${tag}`;

  const anonymous = await request.get(manifestUrl, { headers: { Accept: MANIFEST_ACCEPT_HEADER } });
  if (anonymous.status() === 200) {
    return true;
  }
  if (anonymous.status() !== 401) {
    return false;
  }

  const token = await requestAnonymousToken(request, anonymous.headers()['www-authenticate']);
  const authenticated = await request.get(manifestUrl, {
    headers: { Accept: MANIFEST_ACCEPT_HEADER, Authorization: `Bearer ${token}` },
  });
  return authenticated.status() === 200;
}

/** Parses a `WWW-Authenticate: Bearer realm="...",service="...",scope="..."` challenge and redeems it for a token. */
async function requestAnonymousToken(
  request: APIRequestContext,
  challenge: string | undefined,
): Promise<string> {
  if (!challenge) {
    throw new Error('Registry answered 401 without a WWW-Authenticate challenge');
  }
  const params = Object.fromEntries(
    [...challenge.matchAll(/(\w+)="([^"]*)"/g)].map(match => [match[1], match[2]]),
  );
  const { realm, ...query } = params;
  if (!realm) {
    throw new Error(`WWW-Authenticate challenge has no realm: "${challenge}"`);
  }

  const response = await request.get(realm, { params: query });
  const body = (await response.json()) as { token?: string; access_token?: string };
  const token = body.token ?? body.access_token;
  if (!token) {
    throw new Error(`Registry token endpoint "${realm}" did not return a token`);
  }
  return token;
}
