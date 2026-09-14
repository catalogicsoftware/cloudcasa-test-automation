import { appendFileSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

// The plan allows 700 API calls a day and suspends the account past it, so calls are counted
// across workers as one byte per call in a per-day file and refused once the budget is gone.
const QUOTA_DIR = join(process.cwd(), '.mailinator-quota');
const DEFAULT_DAILY_BUDGET = 400;

const utcDay = (): string => new Date().toISOString().slice(0, 10);

// A typo must not silently restore the default, and 0 is a valid "block every call" setting.
const dailyBudget = (): number => {
  const configured = process.env.MAILINATOR_DAILY_BUDGET?.trim();
  if (!configured) {
    return DEFAULT_DAILY_BUDGET;
  }

  const budget = Number(configured);
  if (!Number.isInteger(budget) || budget < 0) {
    throw new Error(
      `MAILINATOR_DAILY_BUDGET must be a non-negative whole number, got "${configured}"`,
    );
  }

  return budget;
};

const callsRecorded = (file: string): number => {
  try {
    return statSync(file).size;
  } catch {
    return 0;
  }
};

function dropCountersFromOtherDays(currentFile: string): void {
  for (const entry of readdirSync(QUOTA_DIR)) {
    const file = join(QUOTA_DIR, entry);
    if (file !== currentFile) {
      rmSync(file, { force: true });
    }
  }
}

export type QuotaUsage = { used: number; budget: number };

export function quotaUsage(): QuotaUsage {
  return { used: callsRecorded(join(QUOTA_DIR, `${utcDay()}.log`)), budget: dailyBudget() };
}

/** Books one call against today's budget, throwing instead of spending the last of the quota. */
export function reserveApiCall(path: string): void {
  const file = join(QUOTA_DIR, `${utcDay()}.log`);
  mkdirSync(QUOTA_DIR, { recursive: true });
  dropCountersFromOtherDays(file);

  const { used, budget } = quotaUsage();
  if (used >= budget) {
    throw new Error(
      `Mailinator daily budget spent: ${used}/${budget} calls, refusing ${path}. The plan allows ` +
        '700/day and suspends the account past it — raise MAILINATOR_DAILY_BUDGET or wait for the UTC day to roll over.',
    );
  }

  // A single-byte append is atomic enough for parallel workers; a read-modify-write would lose counts.
  appendFileSync(file, '.');
}
