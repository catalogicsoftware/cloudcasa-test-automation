import { expect, test } from '@fixtures/base';

test.beforeEach(async ({ signUpPage }) => {
  // Navigate to Sign Up
  await signUpPage.goto();
});

test.describe('Sign Up New User', () => {
  test('Master Service Agreement matches published version', async ({ signUpPage }) => {
    const result = await signUpPage.verifyMasterServiceAgreement('data/files/CloudCasa-MSA.pdf');
    expect(result.matches, result.differences.join('\n')).toBe(true);
  });
});
