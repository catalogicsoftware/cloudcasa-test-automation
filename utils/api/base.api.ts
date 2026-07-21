import { APIRequestContext } from '@playwright/test';
import { assertResponseOk } from '@utils/generic';

const DEFAULT_API_URL = 'https://api.cloudcasa.io/api/v1';

// CLOUDCASA_API_URL is the full API base including /api/v1 (overridable for
// self-hosted/staging installations). CcApiRoutes values already carry the
// api/v1 prefix — they double as URL matchers for browser traffic — so the
// origin is derived by stripping it here instead of duplicating routes.
export function apiOrigin(): string {
  const base = (process.env.CLOUDCASA_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '');
  return base.replace(/\/api\/v1$/, '');
}

export function apiToken(): string {
  const token = process.env.CLOUDCASA_API_TOKEN;
  if (!token) {
    throw new Error(
      'CLOUDCASA_API_TOKEN is not set — generate an API token in the CloudCasa UI and add it to .env',
    );
  }
  return token;
}

export function apiHeaders(token: string = apiToken()): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export abstract class BaseApi {
  constructor(protected readonly request: APIRequestContext) {}

  protected url(route: string): string {
    return `${apiOrigin()}/${route}`;
  }

  protected get headers(): Record<string, string> {
    return apiHeaders();
  }

  // Eve-style concurrency control: PUT/PATCH/DELETE require If-Match with the
  // resource's current _etag, otherwise the API answers 428/412. Use this when
  // the etag isn't already at hand from a list response.
  protected async fetchEtag(resourceRoute: string): Promise<string> {
    const response = await this.request.get(this.url(resourceRoute), { headers: this.headers });
    await assertResponseOk(response, `GET ${resourceRoute}`);
    const body = (await response.json()) as { _etag?: string };
    if (!body._etag) {
      throw new Error(`Resource ${resourceRoute} has no _etag field`);
    }
    return body._etag;
  }
}
