# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

End-to-end test automation for **CloudCasa** using TypeScript + Playwright.
Tests follow the Page Object Model pattern; fixtures prepare the application to a specific state before each test.

## Commands

```bash
npm test                        # run all tests
npx playwright test <file>      # run a single test file
npm run test:ui                 # Playwright UI mode
npm run test:debug              # debug mode (step-by-step)
npm run test:headed             # visible browser
```

Environment variables (copy `.env.example` → `.env`):

| Variable      | Purpose                                                              |
| ------------- | -------------------------------------------------------------------- |
| `BASE_URL`    | CloudCasa instance URL (default: `https://home.cloudcasa.io`)        |
| `CC_EMAIL`    | Login email                                                          |
| `CC_PASSWORD` | Login password                                                       |
| `SLOW_MO`     | Milliseconds to slow down each browser action (useful for debugging) |

## Architecture

```
pages/              # Page Object Model classes
  base.page.ts      # abstract BasePage — shared waitForLoad(), reloadPage()
  auth/
    login.page.ts   # LoginPage — goto(), login()
  dashboard/
    dashboard.page.ts
fixtures/
  base.ts           # extends Playwright test with page objects (loginPage, dashboardPage)
  auth.ts           # extends base with loggedInPage fixture (performs login, waits for dashboard)
page-factory/       # Component wrappers that auto-generate test.step() labels
  component.ts      # abstract Component — shouldBeVisible(), shouldHaveText(), click()
  button.ts         # Button — hover(), doubleClick()
  input.ts          # Input — fill(), shouldHaveValue()
  link.ts           # Link
  list-item.ts      # ListItem
  title.ts          # Title
data/
  fake.ts           # faker.js helpers — fakeUser() generates email/password/name
tests/              # .spec.ts test files, organized by feature
  auth/
specs/              # Markdown test plans — input for playwright-test-planner agent
seed.spec.ts        # entry point for test-generator agent; import the fixture matching the scenario
```

TypeScript path aliases (defined in `tsconfig.json`): `@pages/*` → `pages/*`, `@fixtures/*` → `fixtures/*`.

### Fixture chain

`@playwright/test` → `fixtures/base.ts` → `fixtures/auth.ts`

Tests that need an authenticated session import from `fixtures/auth.ts`:

```ts
import { test, expect } from '../../fixtures/auth';

test('example', async ({ loggedInPage }) => { ... });
```

Tests that only need page objects (e.g. login tests themselves) import from `fixtures/base.ts`.

### Page Objects

- Each page class extends `BasePage` and receives `Page` in the constructor.
- Locators are declared as readonly class fields using Playwright's semantic selectors (`getByLabel`, `getByRole`, `getByText`).
- Methods represent user actions (`goto()`, `login()`) — no assertions inside page objects.
- Add new page classes under `pages/<feature>/`.

### Page Factory (component wrappers)

`page-factory/` provides typed component classes (`Button`, `Input`, `Link`, `ListItem`, `Title`) that wrap a CSS locator string and automatically wrap every action in a named `test.step()`. Use these in page objects when you want Playwright trace/report labels generated automatically:

```ts
const submitButton = new Button({ page, locator: '#submit', name: 'Submit' });
await submitButton.click(); // step: Click on button "Submit"
await submitButton.shouldBeVisible(); // step: Button "Submit" should be visible
```

These are optional — plain `page.locator()` fields are fine for simple cases.

### Adding a new feature module

1. Create `pages/<feature>/<name>.page.ts` extending `BasePage`
2. Add the page as a fixture in `fixtures/base.ts`
3. If the feature requires auth, extend `fixtures/auth.ts` instead
4. Create `tests/<feature>/` for test files
5. Tests import `{ test, expect }` from the deepest fixture that provides what they need

## Three-agent workflow

| Agent                       | Role                                                                              |
| --------------------------- | --------------------------------------------------------------------------------- |
| `playwright-test-planner`   | Navigates the live app, saves a Markdown test plan to `specs/`                    |
| `playwright-test-generator` | Reads the plan, executes each step in a real browser, writes the `.spec.ts` file  |
| `playwright-test-healer`    | Runs failing tests, debugs them with live browser tools, patches code until green |

Typical flow: **planner → generator → healer** (only when tests break).

### Test file conventions (enforced by generator agent)

- One test per file, filename = filesystem-friendly scenario name
- Header comments: `// spec: specs/plan.md` and `// seed: seed.spec.ts`
- `test.describe` title matches the top-level plan group; `test` title matches the scenario name
- Comment before each step with the step text
- No `waitForNetworkIdle` or other deprecated Playwright APIs
- Dynamic data → regex-based locators
- Irreparably broken test → `test.fixme()` with a comment explaining actual vs. expected behavior
