import { closeSync, mkdirSync, openSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

// fullyParallel spreads spec files across workers, but some Mailinator inboxes back a single
// shared CloudCasa account (see MailinatorInbox.RESET_PWD): two tests resetting/reading that
// inbox and writing that account's password at the same time race each other. A lock file is
// visible to every worker (they share this checkout), so it serializes them the same way
// utils/mailinator-quota.ts counts calls across workers with a shared file.
const LOCK_DIR = join(process.cwd(), '.mailinator-locks');
const POLL_INTERVAL = 500;

// A worker that crashes while holding the lock must not wedge every later run forever.
const STALE_LOCK_AGE = 10 * 60 * 1000;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

function tryCreateLockFile(lockFile: string): boolean {
  try {
    closeSync(openSync(lockFile, 'wx'));
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      return false;
    }
    throw error;
  }
}

function clearIfStale(lockFile: string): void {
  try {
    if (Date.now() - statSync(lockFile).mtimeMs > STALE_LOCK_AGE) {
      unlinkSync(lockFile);
    }
  } catch {
    // Already released by the lock holder between the stat and this call.
  }
}

/** Waits for exclusive use of `name` across every worker, returning the function that releases it. */
export async function acquireLock(name: string): Promise<() => void> {
  mkdirSync(LOCK_DIR, { recursive: true });
  const lockFile = join(LOCK_DIR, `${name}.lock`);

  while (!tryCreateLockFile(lockFile)) {
    clearIfStale(lockFile);
    await sleep(POLL_INTERVAL);
  }

  return () => {
    try {
      unlinkSync(lockFile);
    } catch {
      // Already released.
    }
  };
}
