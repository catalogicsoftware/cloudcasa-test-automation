# AI run analysis (local PoC)

Turns a Playwright run into a plain-English analysis — what broke, the likely cause, the next
step — files flaky tests as GitHub issues for the coding agent, and renders the Teams card.
The model is a Microsoft Foundry deployment (`foundry.mjs`, OpenAI-compatible chat completions with
strict structured outputs) when `FOUNDRY_ENDPOINT`, `FOUNDRY_DEPLOYMENT` and `FOUNDRY_API_KEY` are
set; the endpoint may be pasted from the portal with its path. Otherwise `--provider claude` calls
`claude -p` with the logged-in Claude Code.

```bash
node ci/analysis/analyze.mjs --list-runs        # runs found in allure-results/, newest = 0
node ci/analysis/analyze.mjs --run 5            # analyse run 5
node ci/analysis/analyze.mjs --digest-only      # build the digest, do not call the model
node ci/analysis/analyze.mjs --analysis test-results/analysis/analysis.json   # reuse, no model call
node ci/analysis/analyze.mjs --issues           # really create/comment issues (default: dry run)
node ci/analysis/analyze.mjs --post             # also POST the card to TEAMS_WEBHOOK_URL
```

| Option               | Default                                | Meaning                                                                 |
| -------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `--results`          | `allure-results`                       | Allure raw results directory                                            |
| `--run`              | `0`                                    | Which run to analyse (a local directory piles up runs; CI starts empty) |
| `--provider`         | `foundry` if `FOUNDRY_ENDPOINT` is set | `foundry` or `claude`                                                   |
| `--model`            | `$ANALYSIS_MODEL` or `claude-opus-5-5` | `claude` provider only; Foundry uses `FOUNDRY_DEPLOYMENT`               |
| `--effort`           | `medium`                               | Reasoning effort; Foundry GPT takes `low`, `medium`, `high`             |
| `--out`              | `test-results/analysis`                | Where `digest.json`, `analysis.json`, `teams-card.json` go              |
| `--report-url`       | —                                      | Adds the "Open Allure report" button                                    |
| `--build-url`        | —                                      | Linked from the issues as the run that failed                           |
| `--repo`             | `$GITHUB_REPO` or this repo            | Where issues go                                                         |
| `--issue-categories` | `$ISSUE_CATEGORIES` or `flaky`         | Problem categories filed as issues                                      |

## Files

- `digest.mjs` — reads `*-result.json`, groups retries by `historyId`, keeps the failed step, the
  error, 15 trace lines and the page snapshot from Playwright's `error-context`, maps each spec to
  its `TC-*` plan case, caps the size at 60k chars and redacts secrets.
- `prompt.md` — system prompt; `schema.json` — the JSON shape the model must return.
- `issues.mjs` — GitHub issues, see below.
- `card.mjs` — Adaptive Card 1.4 (TextBlock / Container / FactSet only) plus a terminal rendering.
- `analyze.mjs` — glues it together; a failed model call still produces the card, without analysis.

## GitHub issues

Every failed, broken or flaky test ends up in exactly one problem, and every problem is on the
Teams card. Only problems whose category is in `--issue-categories` (`$ISSUE_CATEGORIES`, default
`flaky`) become issues, labelled `ai-triage` plus the category; the coding-agent orchestrator picks
them up by those labels. Widen it with e.g. `--issue-categories flaky,test-defect`.

- Identity is the test id (`tests/<spec> › <title>`), stored as a hidden `<!-- ai-triage:… -->`
  marker in the issue body. A test that already has an open triage issue gets a "failed again"
  comment there instead of a new issue; tests newly grouped into it get their marker added.
- Closing an issue means "fixed": the next failure of the same test opens a new one.
- `flaky` is only kept when the retry data agrees; a test the model left out gets its own
  `unknown` issue, so nothing is dropped even when the analysis is unavailable.
- Without `--issues` it is a dry run: the plan is printed and the issue texts are written to
  `issues/*.md`. With a `GITHUB_TOKEN` the dry run also reads the open issues to plan comments.

## What leaves the machine

`digest.json` goes to the model and, as issue text, to GitHub; both after redaction: values of every env var whose name contains PASS, TOKEN,
SECRET, KEY, EMAIL, DOMAIN, CODE or HOOK (plus `IN_*`), e-mail addresses and bearer tokens are
replaced. Test titles, step names, locators, resource names and page snapshots are sent as they are.
Review `digest.json` with `--digest-only` before the first real call.

## Cost

One analysis of a ~40-test run (~20–25k-char digest) at `medium` effort, as reported by
`claude -p`: Sonnet 5.5 about 20–25 s and $0.08–0.09, Opus 5.5 about 30 s and $0.15–0.20.
Foundry `gpt-5.4-mini`: 20–40 s, about 7k input and 4–7k output tokens. With less reasoning it is
faster but drops flaky tests and merges unrelated ones, hence `mustReport` in the digest and
`medium` by default.
