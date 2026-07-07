// spec: specs/auth/login.md
// seed: seed.spec.ts

import { test } from '@fixtures/base';
import { fakeUser } from 'data/fake';

test.beforeEach(async ({ loginPage }) => {
  await loginPage.goto();
});

test.describe('Authentication Errors', () => {
  test('Login with wrong password', async ({ loginPage }) => {
    const user = fakeUser();
    // 2. Fill email with a valid registered email
    await loginPage.login(process.env.CC_EMAIL ?? '', user.password);
    // Expected: pink error banner appears, user stays on login page
    await loginPage.errorMessage.shouldBeVisible();
    await loginPage.errorMessage.shouldHaveText('Wrong email or password.');
    await loginPage.emailInput.shouldBeVisible();
    await loginPage.passwordInput.shouldBeVisible();
  });
});
