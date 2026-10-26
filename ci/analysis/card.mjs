// Builds the Teams Workflows message (Adaptive Card 1.4) from the digest, the analysis and its issues.

const VERDICT_COLOUR = { passed: 'good', unstable: 'warning', failed: 'attention' };
const CATEGORY = {
  'product-bug': { label: 'Product bug', colour: 'attention' },
  'test-defect': { label: 'Test defect', colour: 'warning' },
  environment: { label: 'Environment', colour: 'accent' },
  flaky: { label: 'Flaky', colour: 'warning' },
  unknown: { label: 'Unknown cause', colour: 'default' },
};
// Teams renders this TextBlock markdown subset: **bold**, [links](url) and "- " lists.
const text = (value, extra = {}) => ({ type: 'TextBlock', wrap: true, text: value, ...extra });
const column = (items, width = 'auto') => ({ type: 'Column', width, items });
const bullets = items => items.map(item => `- ${item.trim().replace(/[.;]+$/, '')}`).join('\n');
const joinList = items => items.map(item => item.trim().replace(/[.;]+$/, '')).join('; ');
const testTitles = (problem, digest) =>
  problem.tests.map(id => digest.tests.find(t => t.id === id)?.title ?? id);
const issueRef = issue =>
  issue?.url
    ? `GitHub issue [#${issue.number}](${issue.url})${issue.type === 'create' ? ' (new)' : ''}`
    : undefined;

// One big coloured number per status, so the outcome reads at a glance.
function counters(t) {
  const cells = [
    [t.passed, 'passed', 'good'],
    [t.failed, 'failed', 'attention'],
    [t.broken, 'broken', 'attention'],
    [t.flaky, 'flaky', 'warning'],
    [t.skipped, 'skipped', 'default'],
  ].filter(([count, label]) => count || label === 'passed' || label === 'failed');
  return {
    type: 'ColumnSet',
    spacing: 'Medium',
    columns: cells.map(([count, label, colour]) =>
      column([
        text(String(count), {
          size: 'ExtraLarge',
          weight: 'Bolder',
          color: count ? colour : 'default',
        }),
        text(label, { size: 'Small', isSubtle: true, spacing: 'None' }),
      ]),
    ),
  };
}

function problemBlock(problem, digest) {
  const category = CATEGORY[problem.category] ?? { label: problem.category, colour: 'default' };
  const ref = issueRef(problem.issue);
  const titles = testTitles(problem, digest);
  return {
    type: 'Container',
    style: 'emphasis',
    spacing: 'Medium',
    items: [
      {
        type: 'ColumnSet',
        columns: [
          column([text(problem.area, { weight: 'Bolder' })], 'stretch'),
          column([text(category.label, { weight: 'Bolder', color: category.colour })]),
        ],
      },
      text(titles.length > 1 ? bullets(titles) : titles[0], {
        isSubtle: true,
        size: 'Small',
        spacing: 'None',
      }),
      text(`**What happened:** ${problem.what_happened}`, { spacing: 'Small' }),
      text(`**Likely cause:** ${problem.likely_cause}`, { spacing: 'Small' }),
      ...(ref ? [text(ref, { spacing: 'Small', size: 'Small' })] : []),
    ],
  };
}

function folderValue(c) {
  const parts = ['passed', 'failed', 'broken', 'skipped']
    .filter(status => c[status])
    .map(status => `${c[status]} ${status}`);
  return parts.join(' · ') || 'no tests';
}

// problems come from normalizeProblems(), each optionally carrying the issue it was filed under.
export function buildCard({ title, digest, analysis, problems = [], reportUrl, buildUrl }) {
  const t = digest.totals;
  const verdict = analysis?.verdict ?? (t.failed + t.broken > 0 ? 'failed' : 'passed');
  const body = [
    text(title, { weight: 'Bolder', size: 'Medium' }),
    text(`${t.tests} tests in ${digest.durationMin} min`, {
      isSubtle: true,
      size: 'Small',
      spacing: 'None',
    }),
  ];
  if (t.tests) body.push(counters(t));

  if (analysis) {
    body.push(
      text(analysis.headline, {
        weight: 'Bolder',
        size: 'Medium',
        color: VERDICT_COLOUR[verdict],
        spacing: 'Medium',
      }),
      text(analysis.summary, { spacing: 'Small' }),
    );
  } else if (!t.tests) {
    body.push(text('No test results — the build stopped before the tests ran; see the build log.'));
  } else {
    body.push(text('AI analysis unavailable — see the build log.', { isSubtle: true }));
  }
  body.push(...problems.map(p => problemBlock(p, digest)));
  if (analysis?.passed_highlights.length) {
    body.push(
      text('**Working**', { spacing: 'Medium', color: 'good' }),
      text(bullets(analysis.passed_highlights), { spacing: 'Small' }),
    );
  }

  const actions = [];
  if (t.tests) {
    // Hidden until asked for: the per-folder counts are reference, not the story.
    body.push({
      type: 'FactSet',
      id: 'folders',
      isVisible: false,
      separator: true,
      spacing: 'Medium',
      facts: Object.entries(digest.folders).map(([folder, c]) => ({
        title: folder,
        value: folderValue(c),
      })),
    });
    actions.push({
      type: 'Action.ToggleVisibility',
      title: 'Results by folder',
      targetElements: ['folders'],
    });
  }
  if (reportUrl)
    actions.unshift({ type: 'Action.OpenUrl', title: 'Open Allure report', url: reportUrl });
  else if (buildUrl)
    actions.unshift({ type: 'Action.OpenUrl', title: 'Open build', url: buildUrl });

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          type: 'AdaptiveCard',
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          version: '1.4',
          // Without it Teams renders the card at a narrow fixed width.
          msteams: { width: 'Full' },
          body,
          actions,
        },
      },
    ],
  };
}

// Same content as the card, for reading the result in a terminal.
export function renderText({ title, digest, analysis, problems = [] }) {
  const t = digest.totals;
  const lines = [
    title,
    `${t.tests} tests: ${t.passed} passed, ${t.failed} failed, ${t.broken} broken, ${t.skipped} skipped, ${t.flaky} flaky`,
    '',
    ...(analysis ? [analysis.headline, analysis.summary] : ['AI analysis unavailable.']),
    '',
  ];
  for (const p of problems) {
    lines.push(
      `* ${p.area} [${CATEGORY[p.category]?.label ?? p.category}]`,
      `  Tests: ${joinList(testTitles(p, digest))}`,
      `  What happened: ${p.what_happened}`,
      `  Likely cause: ${p.likely_cause}`,
      ...(p.issue?.url ? [`  ${issueRef(p.issue)}`] : []),
      '',
    );
  }
  if (analysis?.passed_highlights.length)
    lines.push(`Working: ${joinList(analysis.passed_highlights)}`);
  return lines.join('\n');
}
