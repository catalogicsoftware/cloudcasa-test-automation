/**
 * Names every resource a test creates as `aqa-<label>-<timestamp>`. The prefix is
 * what cleanup helpers are allowed to delete, so generator and matcher live here
 * together rather than repeating the literal at each site.
 */
const TEST_RESOURCE_PREFIX = 'aqa-';

/** The timestamp keeps parallel workers and CI retries from ever reusing a name. */
export const testResourceName = (label: string): string =>
  `${TEST_RESOURCE_PREFIX}${slug(label)}-${Date.now()}`;

export const isTestResourceName = (name: string): boolean => name.startsWith(TEST_RESOURCE_PREFIX);

/**
 * Wraps a generated name for a table-row/text locator. `hasText` does a case-insensitive
 * substring match on a plain string (rule 14) — a generated name has no regex metacharacters
 * to collide with, but a RegExp keeps every call site consistent regardless.
 */
export const testResourceNamePattern = (name: string): RegExp =>
  new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

const slug = (label: string): string =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
