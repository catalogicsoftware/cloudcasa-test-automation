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

All methods accept an optional `{ locator }` override to target a different selector at call time.

## Component classes

| Class      | `typeOf`    | Extra methods                                               |
| ---------- | ----------- | ----------------------------------------------------------- |
| `Button`   | `button`    | `hover()`, `doubleClick()`                                  |
| `Input`    | `input`     | `fill(value, { validateValue? })`, `shouldHaveValue(value)` |
| `Link`     | `link`      | —                                                           |
| `ListItem` | `list-item` | —                                                           |
| `Title`    | `title`     | —                                                           |

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
