import { expect, test } from '@fixtures/base';

test.beforeEach(async ({ signUpPage }) => {
  await signUpPage.goto();
});

test.describe('Sing Up New User', () => {
  test('Privacy Policy matches published version', async ({ signUpPage }) => {
    const result = await signUpPage.verifyPrivacyPolicy('data/files/PrivacyPolicy.md');
    expect(result).toBe(true);
  });
});
