// spec: specs/auth/login.md
// seed: seed.spec.ts

import { faker } from '@faker-js/faker';
import { test } from '../../fixtures/base';
import { getPasswordResetLink } from '../../utils/testmail';
import { TestmailTag, testmailAddress } from '@data/testmail-tags';

const RESET_PWD_EMAIL = testmailAddress(TestmailTag.RESET_PWD);

test.describe('Forgot Password Flow', () => {
  test('User can reset password via the emailed link and log in with the new password', async ({
    loginPage,
    resetPasswordPage,
    dashboardPage,
  }) => {
    const newPassword = `${faker.internet.password({ length: 16, memorable: false })}1!Aa`;

    // 1. Trigger a password reset email for a registered email
    await loginPage.goto();
    await loginPage.clickForgotPassword();
    await loginPage.emailInput.fill(RESET_PWD_EMAIL);
    const requestedAt = Date.now();
    await loginPage.signInButton.click();

    // Expected: success banner confirms the email was sent
    await loginPage.resetSuccessMessage.shouldBeVisible();

    // 2. Retrieve the email and open the reset link it contains
    const resetLink = await getPasswordResetLink(requestedAt);
    await resetPasswordPage.openResetLink(resetLink);

    // Expected: Auth0's hosted "Change Password" form is shown
    await resetPasswordPage.newPasswordInput.shouldBeVisible();
    await resetPasswordPage.confirmPasswordInput.shouldBeVisible();

    // 3. Set a new password
    await resetPasswordPage.setNewPassword(newPassword);

    // Expected: confirmation that the password was changed
    await resetPasswordPage.successMessage.shouldBeVisible();

    // 4. Log in with the new password
    await loginPage.goto();
    await loginPage.login(RESET_PWD_EMAIL, newPassword);

    // Expected: user is redirected to the dashboard
    await dashboardPage.dashboardContainer.shouldBeVisible();
  });
});
