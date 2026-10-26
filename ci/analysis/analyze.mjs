// allure-results/ -> digest -> Foundry or `claude -p` -> analysis -> GitHub issues + Teams card; run by ci/Jenkinsfile too (see ci/analysis/README.md).
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { buildDigest, listRuns } from './digest.mjs';
import { buildCard, renderText } from './card.mjs';
import { normalizeProblems, previewIssue, syncIssues } from './issues.mjs';
import { analyzeWithFoundry } from './foundry.mjs';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

const { values: args } = parseArgs({
  options: {
    results: { type: 'string', default: 'allure-results' },
    out: { type: 'string', default: 'test-results/analysis' },
    provider: {
      type: 'string',
      // CI has no Claude Code login, so without Foundry it goes without analysis rather than failing on `claude`.
      default: process.env.FOUNDRY_ENDPOINT ? 'foundry' : process.env.CI ? 'none' : 'claude',
    },
    model: { type: 'string', default: process.env.ANALYSIS_MODEL || 'claude-opus-5-5' },
    effort: { type: 'string', default: 'medium' },
    title: { type: 'string', default: 'CloudCasa E2E — local run' },
    'report-url': { type: 'string' },
    'build-url': { type: 'string' },
    run: { type: 'string', default: '0' },
    analysis: { type: 'string' },
    repo: {
      type: 'string',
      default: process.env.GITHUB_REPO || 'catalogicsoftware/claudcasa-test-automation',
    },
    'list-runs': { type: 'boolean', default: false },
    'digest-only': { type: 'boolean', default: false },
    issues: { type: 'boolean', default: false },
    'issue-categories': { type: 'string', default: process.env.ISSUE_CATEGORIES || 'flaky' },
    post: { type: 'boolean', default: false },
  },
});

function analyzeWithClaude(digest) {
  const result = spawnSync(
    'claude',
    [
      '-p',
      'Analyze the CI run digest given on stdin.',
      '--output-format',
      'json',
      '--system-prompt',
      fs.readFileSync(path.join(here, 'prompt.md'), 'utf8'),
      '--json-schema',
      fs.readFileSync(path.join(here, 'schema.json'), 'utf8'),
      '--tools',
      '',
      '--model',
      args.model,
      '--effort',
      args.effort,
      '--max-budget-usd',
      '1',
      '--no-session-persistence',
    ],
    // Run outside the repo so the session picks up no CLAUDE.md, hooks or project settings.
    {
      cwd: os.tmpdir(),
      input: JSON.stringify(digest),
      encoding: 'utf8',
      timeout: 180_000,
      maxBuffer: 20 * 1024 * 1024,
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`claude exited ${result.status}: ${result.stderr || result.stdout}`);
  const reply = JSON.parse(result.stdout);
  if (reply.is_error) throw new Error(`claude reported an error: ${reply.result}`);
  const analysis = reply.structured_output ?? JSON.parse(reply.result);
  return { analysis, costUsd: reply.total_cost_usd, durationMs: reply.duration_ms };
}

async function analyze(digest) {
  if (args.provider === 'none')
    throw new Error('no model configured (FOUNDRY_ENDPOINT is not set)');
  if (args.provider === 'claude') {
    const run = analyzeWithClaude(digest);
    return { ...run, label: `${args.model}, $${run.costUsd?.toFixed(3) ?? '?'}` };
  }
  const { FOUNDRY_ENDPOINT, FOUNDRY_DEPLOYMENT, FOUNDRY_API_KEY } = process.env;
  if (!FOUNDRY_ENDPOINT || !FOUNDRY_DEPLOYMENT || !FOUNDRY_API_KEY)
    throw new Error(
      '--provider foundry needs FOUNDRY_ENDPOINT, FOUNDRY_DEPLOYMENT and FOUNDRY_API_KEY',
    );
  const run = await analyzeWithFoundry({
    digest,
    systemPrompt: fs.readFileSync(path.join(here, 'prompt.md'), 'utf8'),
    schema: JSON.parse(fs.readFileSync(path.join(here, 'schema.json'), 'utf8')),
    endpoint: FOUNDRY_ENDPOINT,
    deployment: FOUNDRY_DEPLOYMENT,
    apiKey: FOUNDRY_API_KEY,
    reasoningEffort: args.effort,
  });
  const u = run.usage ?? {};
  return {
    ...run,
    label: `Foundry ${FOUNDRY_DEPLOYMENT}, ${u.prompt_tokens ?? '?'} in / ${u.completion_tokens ?? '?'} out tokens`,
  };
}

async function post(card) {
  const url = process.env.TEAMS_WEBHOOK_URL;
  if (!url) throw new Error('--post needs TEAMS_WEBHOOK_URL in the environment or .env');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  });
  if (!res.ok) throw new Error(`Teams webhook answered ${res.status}: ${await res.text()}`);
}

if (args['list-runs']) {
  listRuns(args.results).forEach((r, i) =>
    console.log(`${i}	${r.startedAt}	${r.results} results	${JSON.stringify(r.counts)}`),
  );
  process.exit(0);
}

const token = process.env.GITHUB_TOKEN;
if (args.issues && !token)
  throw new Error('--issues needs GITHUB_TOKEN in the environment or .env');

fs.mkdirSync(args.out, { recursive: true });
let built;
try {
  built = buildDigest({ resultsDir: args.results, runIndex: Number(args.run) });
} catch (err) {
  // A build that died before the tests still gets a card that says so.
  console.error(`No test results: ${err.message}`);
  const totals = { tests: 0, passed: 0, failed: 0, broken: 0, skipped: 0, flaky: 0 };
  const startedAt = new Date().toISOString();
  built = { digest: { startedAt, durationMin: 0, totals, mustReport: [], folders: {}, tests: [] } };
}
const { digest, otherRuns } = built;
fs.writeFileSync(path.join(args.out, 'digest.json'), JSON.stringify(digest, null, 2));
const digestChars = JSON.stringify(digest).length;
console.log(
  `Digest: ${digest.totals.tests} tests, ${digestChars} chars` +
    (otherRuns ? ` (run ${args.run} of ${otherRuns + 1} in ${args.results}; see --list-runs)` : ''),
);
if (args['digest-only']) process.exit(0);

let analysis;
if (args.analysis) {
  analysis = JSON.parse(fs.readFileSync(args.analysis, 'utf8'));
  console.log(`Analysis: reused ${args.analysis}`);
} else if (digest.totals.tests) {
  try {
    const run = await analyze(digest);
    analysis = run.analysis;
    fs.writeFileSync(path.join(args.out, 'analysis.json'), JSON.stringify(analysis, null, 2));
    console.log(`Analysis: ${run.label}, ${(run.durationMs / 1000).toFixed(0)} s`);
  } catch (err) {
    // Issues and the card still go out without the analysis, as they will in CI.
    console.error(`AI analysis failed: ${err.message}`);
  }
}

const problems = normalizeProblems(analysis, digest);
const runInfo = {
  name: args.title,
  buildUrl: args['build-url'],
  reportUrl: args['report-url'],
  startedAt: digest.startedAt,
};
// Only these categories become issues for the fix agent; the rest stay on the Teams card.
const issueCategories = args['issue-categories'].split(',').map(c => c.trim());
let actions = [];
try {
  actions = await syncIssues({
    problems: problems.filter(p => issueCategories.includes(p.category)),
    digest,
    run: runInfo,
    repo: args.repo,
    token,
    dryRun: !args.issues,
  });
} catch (err) {
  // A GitHub outage must not cost the Teams card.
  console.error(`GitHub issues failed: ${err.message}`);
}
for (const action of actions) for (const problem of action.problems) problem.issue = action;

// The exact issue texts, for reviewing a dry run before the first --issues.
const previewDir = path.join(args.out, 'issues');
fs.rmSync(previewDir, { recursive: true, force: true });
fs.mkdirSync(previewDir);
problems
  .filter(p => p.issue)
  .forEach((p, i) =>
    fs.writeFileSync(
      path.join(previewDir, `${i + 1}.md`),
      `# ${p.title}\n\n${previewIssue(p, digest, runInfo)}\n`,
    ),
  );

const card = buildCard({
  title: args.title,
  digest,
  analysis,
  problems,
  reportUrl: args['report-url'],
  buildUrl: args['build-url'],
});
fs.writeFileSync(path.join(args.out, 'teams-card.json'), JSON.stringify(card, null, 2));
console.log(`\n${renderText({ title: args.title, digest, analysis, problems })}\n`);

const mode = args.issues
  ? ''
  : ` (dry run${token ? '' : '; no GITHUB_TOKEN, so open issues were not checked'})`;
console.log(`GitHub ${args.repo}${mode}:`);
const verb = args.issues ? '' : 'would ';
for (const a of actions) {
  console.log(
    a.type === 'create'
      ? `  ${verb}create${a.number ? ` #${a.number}` : ''}: [${a.problems[0].category}] ${a.title}`
      : `  ${verb}comment on #${a.number}: ${a.title}`,
  );
}
if (!actions.length) console.log('  nothing to file');
console.log(`\nWritten to ${args.out}/: digest.json, analysis.json, issues/*.md, teams-card.json`);

if (args.post) {
  try {
    await post(card);
    console.log('Teams card posted.');
  } catch (err) {
    console.error(`Teams post failed: ${err.message}`);
    process.exitCode = 1;
  }
}
