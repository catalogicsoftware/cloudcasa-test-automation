import { expect, test } from '@fixtures/base';
import { fakeUser } from 'data/fake';

test.beforeEach(async ({ signUpPage }) => {
  // Navigae to Sign Up
  await signUpPage.goto();
});

test.describe('Sign Up New User', () => {
  test('Create New Cloud Casas Customer', async ({ signUpPage }) => {});
});
