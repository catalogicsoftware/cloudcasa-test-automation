# page-factory

Component wrappers that enrich Playwright locators with automatic `test.step()` labels and shared assertion helpers.

## Why

Raw `page.locator()` calls are invisible in Playwright traces and Allure reports — you see the action but not what it acted on. Component classes solve this by wrapping every interaction in a named step, e.g.:

```
✔ Click on button "Sign In"
✔ Button "Sign In" should be visible on the page
✔ Fill input "Email" with value "user@example.com"
```

## Base: `Component`

All component classes extend `Component`. Constructor:

```ts
new Button({ page, locator: '#submit', name: 'Sign In' });
//                   ^CSS selector    ^label used in step titles
```

`name` is optional — only required if you call `shouldBeVisible()`, `shouldHaveText()`, or any method that uses `componentName` in its step label.

### Shared methods (inherited by all)

| Method                 | Step label generated                            |
| ---------------------- | ----------------------------------------------- |
| `click()`              | `Click on <type> "<name>"`                      |
| `shouldBeVisible()`    | `<Type> "<name>" should be visible on the page` |
| `shouldHaveText(text)` | `<Type> "<name>" should have text "<text>"`     |
| `shouldBeEnabled()`    | `<Type> "<name>" should be enabled`             |
| `shouldBeDisabled()`   | `<Type> "<name>" should be disabled`            |

All methods accept an optional `{ locator }` override to target a different selector at call time.

## Component classes

| Class       | `typeOf`    | Extra methods                                                                                                                                                                                        |
| ----------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`    | `button`    | `hover()`, `doubleClick()`                                                                                                                                                                           |
| `Checkbox`  | `checkbox`  | `check()`, `uncheck()`                                                                                                                                                                               |
| `Container` | `container` | —                                                                                                                                                                                                    |
| `Dropdown`  | `dropdown`  | `selectOption(value, { validateValue? })`, `selectByText(text, { search?, keepOpen?, optionLocator? })`, `unselectByText(text)`, `shouldHaveSelected(text)`, `closeMenu()`, `shouldHaveValue(value)` |
| `Input`     | `input`     | `fill(value, { validateValue? })`, `shouldHaveValue(value)`                                                                                                                                          |
| `Link`      | `link`      | —                                                                                                                                                                                                    |
| `ListItem`  | `list-item` | —                                                                                                                                                                                                    |
| `Table`     | `table`     | `getRow(text)`, `getCellValue(rowText, columnTitle)`, `shouldHaveCellValue(rowText, columnTitle, expected)`, `shouldHaveRow(text)`, `shouldNotHaveRow(text)`, `clickRowAction(rowText, actionName)`  |
| `Title`     | `title`     | —                                                                                                                                                                                                    |

### `Dropdown`

Built for CloudCasa's `app-input-select-filter` widget (a `mat-menu`-based multi-select whose options render in an overlay outside the trigger). The menu stays open after picking an option and ignores Escape — only its footer "close" button or a backdrop click dismisses it.

- `selectByText(text)` — opens the menu, clicks the option (`button.mat-menu-item` containing the text), then closes the menu. Options: `search: true` filters via the menu's search field first (long/paginated lists), `keepOpen: true` skips closing (picking several values), `optionLocator` overrides the option selector for other widgets.
- `unselectByText(text)` — clicks the "×" on the value's badge inside the trigger.
- `shouldHaveSelected(text)` — asserts a badge with the value is shown in the trigger.
- `closeMenu()` — closes the open menu via its "close" button.
- `selectOption(value)` / `shouldHaveValue(value)` — for native `<select>` elements; `validateValue: true` adds the value check after selection.

The trigger buttons carry no unique attributes — anchor them to the field's label wrapper, e.g. `.form-group:has(label[for*="roles"]) button.mat-menu-trigger`.

### `Table`

Built for CloudCasa's `table.table-cc` tables (e.g. Configuration → Users / Invitations). Cells are addressed by **row text × column header title**; the column index is resolved at call time from the visible headers, so hiding or reordering columns via the column selector does not break addressing.

```ts
const invitationsTable = new Table({ page, locator: 'app-users table', name: 'Invitations' });

await invitationsTable.shouldHaveRow(user.email);
await invitationsTable.shouldHaveCellValue(user.email, 'State', 'PENDING');
await invitationsTable.clickRowAction(user.email, 'Resend');
```

- `getRow(text)` — row locator containing the text (no assertion; for composition).
- `getCellValue(rowText, columnTitle)` — trimmed `innerText` of the cell at row × column.
- `shouldHaveCellValue(rowText, columnTitle, expected)` — `toContainText` assertion on that cell; `expected` may be a string or RegExp.
- `shouldHaveRow(text)` / `shouldNotHaveRow(text)` — row is visible / absent (the latter uses `toHaveCount(0)`, so it passes on an empty table).
- `clickRowAction(rowText, actionName)` — hovers the row (action buttons are hover-revealed) and clicks the button with the text (`Resend`, `Cancel`, ...) inside `td.table__actions-wrapper`.
- Unknown column title → throws an error listing the currently visible column titles.

Filtering/search lives outside the `<table>` element and is a page-object concern, not part of `Table`.

### `Input.fill(value, { validateValue })`

When `validateValue: true` is passed, fill is followed by an automatic `shouldHaveValue()` assertion inside the same step.

## Usage in a page object

```ts
import { Button } from '../../page-factory/button';
import { Input } from '../../page-factory/input';

export class LoginPage extends BasePage {
  private emailInput = new Input({ page: this.page, locator: '#email', name: 'Email' });
  private submitBtn = new Button({ page: this.page, locator: '#btn-login', name: 'Sign In' });

  async login(email: string, password: string) {
    await this.emailInput.fill(email, { validateValue: true });
    await this.submitBtn.click();
  }
}
```

## When to use vs. plain locators

Use component classes when:

- The interaction will appear in Allure/HTML reports and the label matters.
- You want the built-in assertions (`shouldBeVisible`, `shouldHaveText`) without writing `expect` calls.

Plain `page.locator()` fields are fine for simple internal locators or when you write your own `test.step()`.
