// Files each analysed problem as a GitHub issue, or comments on the open issue already tracking it.
const API = 'https://api.github.com';
const TRIAGE_LABEL = 'ai-triage';
const LABEL_COLOURS = {
  [TRIAGE_LABEL]: '5319e7',
  'product-bug': 'd73a4a',
  'test-defect': 'fbca04',
  environment: '0e8a16',
  flaky: 'f9a03f',
  unknown: 'cccccc',
};
// One marker per test id; the id is the identity that stays stable across runs and groupings.
const marker = id => `<!-- ai-triage:${id} -->`;
const MARKER_RE = /<!-- ai-triage:(.+?) -->/g;

const needsIssue = t => t.status === 'failed' || t.status === 'broken' || t.flaky;

// The model's grouping, minus unknown ids, plus a fallback problem for any test it left out.
export function normalizeProblems(analysis, digest) {
  const byId = new Map(digest.tests.map(t => [t.id, t]));
  const seen = new Set();
  const problems = (analysis?.problems ?? [])
    .map(p => ({
      ...p,
      tests: p.tests.filter(id => byId.has(id) && !seen.has(id) && seen.add(id)),
    }))
    .filter(p => p.tests.length)
    // The flaky label drives the fix queue, so it must match the retry data, not the model's hunch.
    .map(p =>
      p.category === 'flaky' && !p.tests.every(id => byId.get(id).flaky)
        ? { ...p, category: 'unknown' }
        : p,
    );
  for (const t of digest.tests.filter(t => needsIssue(t) && !seen.has(t.id))) {
    problems.push({
      tests: [t.id],
      title: `${t.title}: ${t.flaky ? 'passed only on retry' : t.status}`,
      area: t.folder,
      what_happened: t.message?.split('\n')[0] ?? `The test ${t.status}.`,
      likely_cause: analysis
        ? 'The analysis did not cover this test.'
        : 'AI analysis was unavailable for this run.',
      category: t.flaky ? 'flaky' : 'unknown',
      next_step: 'Open the trace in the Allure report.',
    });
  }
  return problems;
}

const fence = text => `\`\`\`\n${text.replace(/```/g, "'''")}\n\`\`\``;

function testSection(t) {
  const lines = [`#### ${t.title}`, '', `- Spec: \`${t.spec}\``];
  if (t.planCase) lines.push(`- Plan case: ${t.planCase}`);
  lines.push(
    `- Result: ${t.flaky ? `passed on attempt ${t.attempts} (flaky)` : `${t.status} after ${t.attempts} attempt(s)`}`,
  );
  if (t.failedStep) lines.push(`- Failed step: ${t.failedStep}`);
  if (t.message) lines.push('', fence(t.message));
  if (t.trace)
    lines.push('', '<details><summary>Stack trace</summary>', '', fence(t.trace), '', '</details>');
  if (t.pageSnapshot)
    lines.push(
      '',
      '<details><summary>Page at the moment of failure</summary>',
      '',
      fence(t.pageSnapshot),
      '',
      '</details>',
    );
  return lines.join('\n');
}

function runLine(run) {
  return run.buildUrl
    ? `[${run.name}](${run.buildUrl}), started ${run.startedAt}`
    : `${run.name}, started ${run.startedAt}`;
}

function problemDetails(problem, tests) {
  return [
    `**Category:** ${problem.category} · **Area:** ${problem.area}`,
    '',
    '### What happened',
    problem.what_happened,
    '',
    '### Likely cause',
    problem.likely_cause,
    '',
    '### Next step',
    problem.next_step,
    '',
    '### Tests',
    '',
    ...tests.map(testSection),
  ].join('\n');
}

function issueBody(problem, tests, run) {
  return [
    `First seen in ${runLine(run)}.`,
    ...(run.reportUrl ? [`Allure report: ${run.reportUrl}`] : []),
    '',
    problemDetails(problem, tests),
    '',
    '---',
    '_Filed automatically from the CI run analysis (ci/analysis). Later failures are added as comments._',
    ...problem.tests.map(marker),
  ].join('\n');
}

function commentBody(problems, testsOf, run) {
  return [
    `Failed again in ${runLine(run)}.`,
    ...(run.reportUrl ? [`Allure report: ${run.reportUrl}`] : []),
    '',
    ...problems.flatMap(p => [problemDetails(p, testsOf(p)), '']),
  ].join('\n');
}

async function gh(token, method, route, body) {
  const res = await fetch(`${API}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 404 && method === 'GET') return undefined;
  if (!res.ok)
    throw new Error(`GitHub ${method} ${route} answered ${res.status}: ${await res.text()}`);
  return res.status === 204 ? undefined : res.json();
}

// Open triage issues keyed by the test ids they track; the issues list endpoint, unlike search, has no indexing lag.
async function openIssuesBySpec(token, repo) {
  const byId = new Map();
  for (let page = 1; ; page++) {
    const issues = await gh(
      token,
      'GET',
      `/repos/${repo}/issues?state=open&labels=${TRIAGE_LABEL}&per_page=100&page=${page}`,
    );
    for (const issue of issues.filter(i => !i.pull_request)) {
      for (const [, id] of (issue.body ?? '').matchAll(MARKER_RE)) {
        if (!byId.has(id)) byId.set(id, issue);
      }
    }
    if (issues.length < 100) return byId;
  }
}

async function ensureLabels(token, repo, names) {
  for (const name of names) {
    if (await gh(token, 'GET', `/repos/${repo}/labels/${encodeURIComponent(name)}`)) continue;
    await gh(token, 'POST', `/repos/${repo}/labels`, { name, color: LABEL_COLOURS[name] });
  }
}

// Plans (dryRun) or applies the issue changes; a tokenless dry run cannot see open issues, so all look new.
export async function syncIssues({ problems, digest, run, repo, token, dryRun }) {
  const byId = new Map(digest.tests.map(t => [t.id, t]));
  const testsOf = p => p.tests.map(id => byId.get(id));
  const existing = token ? await openIssuesBySpec(token, repo) : new Map();

  // Problems that hit an already tracked test go to that issue; several may share one comment.
  const comments = new Map();
  const creates = [];
  for (const problem of problems) {
    const issue = problem.tests.map(id => existing.get(id)).find(Boolean);
    if (!issue) creates.push(problem);
    else comments.set(issue.number, [...(comments.get(issue.number) ?? []), problem]);
  }

  const actions = [];
  for (const [number, issueProblems] of comments) {
    const issue = [...existing.values()].find(i => i.number === number);
    const untracked = issueProblems
      .flatMap(p => p.tests)
      .filter(id => existing.get(id)?.number !== number);
    actions.push({
      type: 'comment',
      number,
      url: issue.html_url,
      title: issue.title,
      problems: issueProblems,
    });
    if (dryRun) continue;
    await gh(token, 'POST', `/repos/${repo}/issues/${number}/comments`, {
      body: commentBody(issueProblems, testsOf, run),
    });
    // Tests newly grouped into this issue get markers so later runs find it too.
    if (untracked.length) {
      await gh(token, 'PATCH', `/repos/${repo}/issues/${number}`, {
        body: [issue.body, ...untracked.map(marker)].join('\n'),
      });
    }
  }

  if (creates.length && !dryRun)
    await ensureLabels(token, repo, [TRIAGE_LABEL, ...new Set(creates.map(p => p.category))]);
  for (const problem of creates) {
    const action = { type: 'create', title: problem.title, problems: [problem] };
    actions.push(action);
    if (dryRun) continue;
    const issue = await gh(token, 'POST', `/repos/${repo}/issues`, {
      title: problem.title,
      body: issueBody(problem, testsOf(problem), run),
      labels: [TRIAGE_LABEL, problem.category],
    });
    Object.assign(action, { number: issue.number, url: issue.html_url });
  }
  return actions;
}

// Same issue text as syncIssues would send, for reviewing a dry run.
export function previewIssue(problem, digest, run) {
  const byId = new Map(digest.tests.map(t => [t.id, t]));
  return issueBody(
    problem,
    problem.tests.map(id => byId.get(id)),
    run,
  );
}
