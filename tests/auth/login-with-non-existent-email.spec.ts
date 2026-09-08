// spec: specs/auth/login.md
// seed: seed.spec.ts

import { test } from '@fixtures/base';
import { fakeUser } from '../../data/fake';

test.beforeEach(async ({ loginPage }) => {
  await loginPage.goto();
});

test.describe('Authentication Errors', () => {
  test('Login with non-existent email', async ({ loginPage }) => {
    const user = fakeUser();

    // 2. Fill email with a randomly generated non-existent address
    await loginPage.emailInput.fill(user.email);

    // 3. Fill password with a randomly generated value
    await loginPage.passwordInput.fill(user.password);

    // 4. Click the Sign In button
    await loginPage.signInButton.click();

    // Expected: same generic error — does not reveal whether email exists
    await loginPage.errorMessage.shouldBeVisible();
    await loginPage.errorMessage.shouldHaveText('Wrong email or password.');
  });
});
