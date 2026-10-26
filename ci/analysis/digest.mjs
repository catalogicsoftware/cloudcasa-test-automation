// Turns allure-results/ into the compact, redacted JSON digest the analysis model reads.
import fs from 'node:fs';
import path from 'node:path';

const KNOWN_STATUSES = ['passed', 'failed', 'broken', 'skipped'];
// Attachment pseudo-steps and hooks carry no user-journey meaning.
const NOISE_STEPS = new Set([
  'screenshot',
  'video',
  'error-context',
  'trace',
  'Before Hooks',
  'After Hooks',
]);
const SECRET_ENV = /PASS|TOKEN|SECRET|KEY|EMAIL|DOMAIN|CODE|HOOK|^IN_/i;
const MAX_DIGEST_CHARS = 60_000;

// eslint-disable-next-line no-control-regex -- ANSI colour codes start with ESC by definition.
const stripAnsi = text => text.replace(/\u001b\[[0-9;]*m/g, '');
const clip = (text, max) => (text.length > max ? `${text.slice(0, max)}…` : text);

function readResults(dir) {
  return fs
    .readdirSync(dir)
    .filter(name => name.endsWith('-result.json'))
    .flatMap(name => {
      try {
        return [JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'))];
      } catch {
        return [];
      }
    });
}

// CI starts from an empty allure-results/, but a local one piles up runs split by idle gaps.
export function splitRuns(results, gapMinutes = 30) {
  const sorted = [...results].sort((a, b) => a.start - b.start);
  const runs = [];
  for (const result of sorted) {
    const current = runs[runs.length - 1];
    const last = current?.[current.length - 1];
    if (last && result.start - (last.stop ?? last.start) <= gapMinutes * 60_000)
      current.push(result);
    else runs.push([result]);
  }
  return runs.reverse();
}

function failedStepPath(steps, trail = []) {
  for (const step of steps ?? []) {
    if (NOISE_STEPS.has(step.name)) continue;
    if (step.status === 'failed' || step.status === 'broken') {
      return failedStepPath(step.steps, [...trail, step.name]);
    }
  }
  return trail;
}

function pageSnapshot(result, dir) {
  const step = (result.steps ?? []).find(s => s.name === 'error-context');
  const source = step?.attachments?.[0]?.source;
  if (!source || !fs.existsSync(path.join(dir, source))) return undefined;
  const text = fs.readFileSync(path.join(dir, source), 'utf8');
  // Only the page snapshot — the file's own "# Instructions" header is meant for a different agent.
  const yaml = text.match(/```yaml\n([\s\S]*?)```/);
  return yaml ? clip(yaml[1].trim(), 2500) : undefined;
}

// Maps a spec path to the "TC-XXX — title" heading whose **Test:** line names it.
function planCases(specsDir) {
  const cases = new Map();
  if (!fs.existsSync(specsDir)) return cases;
  const walk = dir =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? walk(full) : e.name.endsWith('.md') ? [full] : [];
    });
  for (const file of walk(specsDir)) {
    let heading;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const h = line.match(/^##+\s+(TC-[A-Z0-9-]+\s+—\s+[^🔴🟠🟡🟢✅⛔—]+)/u);
      if (h) heading = h[1].trim();
      const t = line.match(/^\*\*Test:\*\*\s+`tests\/([^`]+)`/);
      if (t && heading && !cases.has(t[1])) cases.set(t[1], heading);
    }
  }
  return cases;
}

function secretValues(env) {
  return Object.entries(env)
    .filter(([name, value]) => SECRET_ENV.test(name) && value && value.length >= 4)
    .map(([, value]) => value)
    .sort((a, b) => b.length - a.length);
}

export function redact(text, secrets) {
  let out = text;
  for (const secret of secrets) out = out.split(secret).join('<redacted>');
  return out
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '<email>')
    .replace(/(Bearer|Token)\s+[\w.~+/=-]{12,}/gi, '$1 <redacted>');
}

function testEntry(attempts, dir, cases) {
  const final = attempts[attempts.length - 1];
  const status = KNOWN_STATUSES.includes(final.status) ? final.status : 'broken';
  const spec = final.fullName.replace(/:\d+:\d+$/, '').replace(/\\/g, '/');
  const entry = {
    // One spec file can hold several tests (parametrised cases), so the id adds the title.
    id: `tests/${spec} › ${final.name}`,
    folder: spec.includes('/') ? spec.split('/')[0] : 'other',
    suite: final.titlePath?.[final.titlePath.length - 1],
    title: final.name,
    spec: `tests/${spec}`,
    planCase: cases.get(spec),
    status,
    attempts: attempts.length,
    flaky:
      status === 'passed' && attempts.some(a => a.status === 'failed' || a.status === 'broken'),
    durationSec: Math.round(((final.stop ?? final.start) - final.start) / 1000),
  };
  if (status === 'passed' && !entry.flaky) return entry;

  // A flaky test is explained by the attempt that failed, not by the one that passed.
  const failing = entry.flaky ? attempts.findLast(a => a.status !== 'passed') : final;
  const details = failing.statusDetails ?? {};
  entry.steps = (failing.steps ?? []).map(s => s.name).filter(n => !NOISE_STEPS.has(n));
  entry.failedStep = failedStepPath(failing.steps).join(' > ') || undefined;
  entry.message = details.message ? clip(stripAnsi(details.message), 800) : undefined;
  if (status !== 'skipped') {
    entry.trace = details.trace
      ? stripAnsi(details.trace).split('\n').slice(0, 15).join('\n')
      : undefined;
    entry.pageSnapshot = pageSnapshot(failing, dir);
  }
  return entry;
}

function shrink(digest) {
  // Cut the bulkiest, least useful detail first until the digest fits.
  const passes = [
    t => delete t.steps,
    t => t.pageSnapshot && (t.pageSnapshot = clip(t.pageSnapshot, 800)),
    t => delete t.trace,
    t => delete t.pageSnapshot,
  ];
  for (const pass of passes) {
    if (JSON.stringify(digest).length <= MAX_DIGEST_CHARS) break;
    digest.tests.forEach(pass);
  }
  return digest;
}

export function listRuns(resultsDir = 'allure-results') {
  return splitRuns(readResults(resultsDir)).map(run => {
    const counts = {};
    for (const r of run) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return { startedAt: new Date(run[0].start).toISOString(), results: run.length, counts };
  });
}

// runIndex 0 is the newest run, 1 the one before it, and so on.
export function buildDigest({
  resultsDir = 'allure-results',
  specsDir = 'specs',
  runIndex = 0,
  env = process.env,
} = {}) {
  const runs = splitRuns(readResults(resultsDir));
  if (runs.length === 0) throw new Error(`No *-result.json files in ${resultsDir}`);
  const run = runs[runIndex];
  if (!run)
    throw new Error(`Only ${runs.length} runs in ${resultsDir}; --run ${runIndex} does not exist`);
  const dropped = runs.length - 1;

  const byTest = new Map();
  for (const result of run) {
    const key = result.historyId ?? result.fullName;
    byTest.set(key, [...(byTest.get(key) ?? []), result]);
  }
  const cases = planCases(specsDir);
  const tests = [...byTest.values()].map(attempts => testEntry(attempts, resultsDir, cases));
  tests.sort((a, b) => a.folder.localeCompare(b.folder) || a.title.localeCompare(b.title));

  const totals = { passed: 0, failed: 0, broken: 0, skipped: 0, flaky: 0 };
  const folders = {};
  for (const t of tests) {
    totals[t.status]++;
    if (t.flaky) totals.flaky++;
    folders[t.folder] ??= { passed: 0, failed: 0, broken: 0, skipped: 0 };
    folders[t.folder][t.status]++;
  }
  const start = Math.min(...run.map(r => r.start));
  const stop = Math.max(...run.map(r => r.stop ?? r.start));
  const digest = shrink({
    startedAt: new Date(start).toISOString(),
    durationMin: Math.round((stop - start) / 60_000),
    totals: { tests: tests.length, ...totals },
    // An explicit checklist; smaller models otherwise drop tests that are not plain failures.
    mustReport: tests
      .filter(t => t.status === 'failed' || t.status === 'broken' || t.flaky)
      .map(t => t.id),
    folders,
    tests,
  });
  return {
    digest: JSON.parse(redact(JSON.stringify(digest), secretValues(env))),
    otherRuns: dropped,
  };
}
