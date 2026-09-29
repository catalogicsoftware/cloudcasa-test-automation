// spec: specs/auth/auth.md (TC-AUTH-004)
// seed: seed.spec.ts

import { faker } from '@faker-js/faker';
import { test, expect } from '@fixtures/auth';
import { LoginPage } from '@page-object-model/pages/auth/login.page';
import { ResetPasswordPage } from '@page-object-model/pages/auth/reset-password.page';
import { DashboardPage } from '@page-object-model/pages/dashboard.page';
import { getPasswordResetLink, resetInbox } from '@utils/mailinator';
import { MailinatorInbox, mailboxAddress } from '@data/mailinator-inboxes';
import { PASSWORD_RESET_REUSE_LOCKED_TEST_TIMEOUT } from '@data/timeouts';

const RESET_PWD_EMAIL = mailboxAddress(MailinatorInbox.RESET_PWD);

// The account has no login of its own anywhere else in this suite -- only the mail-driven
// reset flow ever touches it -- so a test cannot read back whatever password it already
// holds. This is the value every test that changes it converges back on afterwards (see
// .env.example), keeping the account reusable instead of drifting to a random leftover value.
const BASELINE_PASSWORD = process.env.RESET_PWD_PASSWORD;

test.describe('Authentication', () => {
  test.describe.configure({ timeout: PASSWORD_RESET_REUSE_LOCKED_TEST_TIMEOUT });

  test('A password reset link works one time only', async ({
    loginPage,
    resetPasswordPage,
    browser,
    mailboxAccess,
    resetPwdAccountLock,
  }) => {
    if (!BASELINE_PASSWORD) {
      throw new Error(
        'RESET_PWD_PASSWORD must be set -- see .env.example. This test restores the reset ' +
          'account to that password once it is done.',
      );
    }

    const newPassword = `${faker.internet.password({ length: 16, memorable: false })}1!Aa`;

    // 1. Ask for a password reset for the account.
    await loginPage.goto();
    await loginPage.clickForgotPassword();
    await loginPage.emailInput.fill(RESET_PWD_EMAIL);
    const requestedAt = await resetInbox(RESET_PWD_EMAIL);
    await loginPage.signInButton.click();
    await loginPage.resetSuccessMessage.shouldBeVisible();

    // 2. Read the reset link from the inbox with @utils/mailinator.ts.
    const resetLink = await getPasswordResetLink(requestedAt);

    // 3. Open the link and set a new password.
    await resetPasswordPage.openResetLink(resetLink);
    await resetPasswordPage.setNewPassword(newPassword);

    // 4. Make sure that the application reports the success.
    await resetPasswordPage.successMessage.shouldBeVisible();

    // 5. Open the same link a second time in a clean context.
    const reusedLinkContext = await browser.newContext();
    const reusedLinkPage = await reusedLinkContext.newPage();
    const reusedResetPasswordPage = new ResetPasswordPage(reusedLinkPage);
    await reusedResetPasswordPage.openWithoutWaitingForForm(resetLink);

    // 6. Make sure that the page refuses the link.
    await reusedResetPasswordPage.usedLinkErrorMessage.shouldBeVisible();

    // 7. Make sure that the message names the cause. The message must say that the link is
    // used or expired.
    await expect(reusedResetPasswordPage.usedLinkErrorMessage.getLocator()).toContainText(
      /used|expired/i,
    );

    // 8. Make sure that the page does not show the form for a new password.
    await expect(reusedResetPasswordPage.newPasswordInput.getLocator()).toBeHidden();

    // 9. Log in with the new password.
    const reusedLoginPage = new LoginPage(reusedLinkPage);
    const reusedDashboardPage = new DashboardPage(reusedLinkPage);
    await reusedLoginPage.goto();
    await reusedLoginPage.login(RESET_PWD_EMAIL, newPassword);
    await reusedDashboardPage.userHelpModal.closeModal();

    // 10. Make sure that the user gets the dashboard.
    await reusedDashboardPage.dashboardContainer.shouldBeVisible();

    await reusedLinkContext.close();

    // Cleanup: 11. Set the password back to the first value.
    await loginPage.goto();
    await loginPage.clickForgotPassword();
    await loginPage.emailInput.fill(RESET_PWD_EMAIL);
    const cleanupRequestedAt = await resetInbox(RESET_PWD_EMAIL);
    await loginPage.signInButton.click();
    await loginPage.resetSuccessMessage.shouldBeVisible();

    const cleanupResetLink = await getPasswordResetLink(cleanupRequestedAt);
    await resetPasswordPage.openResetLink(cleanupResetLink);
    await resetPasswordPage.setNewPassword(BASELINE_PASSWORD);
    await resetPasswordPage.successMessage.shouldBeVisible();
  });
});
