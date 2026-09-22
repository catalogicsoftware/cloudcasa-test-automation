import { mkdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { STORAGE_TEST_TIMEOUT } from '@data/timeouts';

// Two S3-compatible catalog targets (see data/storage.ts) can be reused by more than one spec
// file — the bucket's uniqueness constraint on the backend, and the stale-bucket sweep both
// tests run before creating their storage, make concurrent access to the same bucket unsafe
// even though the suite is fullyParallel. A held lock older than a full test's own timeout
// budget can only mean its holder crashed without releasing it, so it is safe to steal.
const LOCK_DIR = join(process.cwd(), '.storage-locks');
const STALE_LOCK_AFTER_MS = STORAGE_TEST_TIMEOUT + 30_000;
const POLL_INTERVAL_MS = 500;

const lockPath = (bucket: string): string =>
  join(LOCK_DIR, `${bucket.replace(/[^a-zA-Z0-9_-]/g, '_')}.lock`);

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

async function acquire(bucket: string): Promise<string> {
  const path = lockPath(bucket);
  mkdirSync(LOCK_DIR, { recursive: true });

  for (;;) {
    try {
      mkdirSync(path);
      return path;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
      try {
        if (Date.now() - statSync(path).mtimeMs > STALE_LOCK_AFTER_MS) {
          rmSync(path, { recursive: true, force: true });
          continue;
        }
      } catch {
        // Another worker released or stole it between the failed mkdir and this stat — retry.
      }
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

/** Runs `run` with exclusive access to `bucket` across every worker/process, waiting out any holder. */
export async function withExclusiveBucket<T>(bucket: string, run: () => Promise<T>): Promise<T> {
  const path = await acquire(bucket);
  try {
    return await run();
  } finally {
    rmSync(path, { recursive: true, force: true });
  }
}
