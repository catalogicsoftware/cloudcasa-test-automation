import { test } from '@fixtures/base';

test.beforeEach(async ({ signUpPage }) => {
  // Navigate to Sign Up
  await signUpPage.goto();
});

test.describe('Sign Up New User', () => {
  // Body was never written — the test reported green while asserting nothing.
  // eslint-disable-next-line playwright/expect-expect
  test.fixme('Create New Cloud Casas Customer', () => {});
});
