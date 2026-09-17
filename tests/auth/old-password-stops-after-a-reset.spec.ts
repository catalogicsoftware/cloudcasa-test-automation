// spec: specs/auth/auth.md (TC-AUTH-005)

import { test, expect } from '@fixtures/auth';
import { fakeUser } from '@data/fake';
import { getPasswordResetLink, resetInbox } from '@utils/mailinator';
import { MailinatorInbox, mailboxAddress } from '@data/mailinator-inboxes';
import { DOUBLE_PASSWORD_RESET_TEST_TIMEOUT } from '@data/timeouts';
import { LoginPage } from '@page-object-model/pages/auth/login.page';
import { ResetPasswordPage } from '@page-object-model/pages/auth/reset-password.page';

const RESET_PWD_EMAIL = mailboxAddress(MailinatorInbox.RESET_PWD);

// Same flow as tests/auth/password-reset-flow-completes.spec.ts, reused here for both the
// reset under test and the cleanup reset that restores the account.
async function resetPasswordTo(
  loginPage: LoginPage,
  resetPasswordPage: ResetPasswordPage,
  password: string,
): Promise<void> {
  await loginPage.goto();
  await loginPage.clickForgotPassword();
  await loginPage.emailInput.fill(RESET_PWD_EMAIL);
  const requestedAt = await resetInbox(RESET_PWD_EMAIL);
  await loginPage.signInButton.click();
  await loginPage.resetSuccessMessage.shouldBeVisible();

  const resetLink = await getPasswordResetLink(requestedAt);
  await resetPasswordPage.openResetLink(resetLink);
  await resetPasswordPage.setNewPassword(password);
  await resetPasswordPage.successMessage.shouldBeVisible();
}

test.describe('Authentication', () => {
  // Two full reset flows run in this test (the reset under test plus the cleanup reset),
  // each waiting on its own Mailinator email.
  test.describe.configure({ timeout: DOUBLE_PASSWORD_RESET_TEST_TIMEOUT });

  test('The old password does not work after a password reset', async ({
    page,
    loginPage,
    resetPasswordPage,
    dashboardPage,
    mailboxAccess,
  }) => {
    // 1. Read the current password of the reset account from the environment.
    const oldPassword = process.env.RESET_PWD_PASSWORD;
    if (!oldPassword) {
      throw new Error('RESET_PWD_PASSWORD must be set — see .env.example');
    }

    // 2. Make a new password with the helper in @data/fake.
    const newPassword = fakeUser().password;

    // Tracks whether step 8 leaves the browser on an authenticated session, so the cleanup
    // can log out first — a session left active would make loginPage.goto() bounce straight
    // back to the dashboard instead of showing the login form.
    let loggedIn = false;

    try {
      // 3. Do the full password reset flow. Use the same steps as
      // tests/auth/password-reset-flow-completes.spec.ts.
      await resetPasswordTo(loginPage, resetPasswordPage, newPassword);

      // 4. Open the login page.
      await loginPage.goto();

      // 5. Log in with the old password.
      await loginPage.login(RESET_PWD_EMAIL, oldPassword);

      // 6. Make sure that the form shows the message "Wrong email or password.".
      await loginPage.errorMessage.shouldBeVisible();
      await loginPage.errorMessage.shouldHaveText('Wrong email or password.');

      // 7. Make sure that the browser stays on the login page.
      await expect(page).toHaveURL(/\/login/);

      // 8. Log in with the new password.
      await loginPage.goto();
      await loginPage.login(RESET_PWD_EMAIL, newPassword);
      loggedIn = true;

      // 9. Make sure that the user gets the dashboard.
      await dashboardPage.shouldOpen();
      await dashboardPage.userHelpModal.closeModal();
    } finally {
      // A session left active here would make the cleanup's loginPage.goto() bounce
      // straight back to the dashboard instead of showing the login form.
      if (loggedIn) {
        await dashboardPage.userMenu.open();
        await dashboardPage.userMenu.logout();
      }

      // 10. Set the password back to the first value with one more reset flow.
      await resetPasswordTo(loginPage, resetPasswordPage, oldPassword);
    }

    // 11. Make sure that the login with the first password works again.
    await loginPage.goto();
    await loginPage.login(RESET_PWD_EMAIL, oldPassword);
    await dashboardPage.shouldOpen();
    await dashboardPage.userHelpModal.closeModal();
  });
});
