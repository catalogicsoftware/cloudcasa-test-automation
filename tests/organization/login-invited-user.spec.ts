import { test, expect } from '@fixtures/auth';
import { getInvitation } from '@utils/testmail';
import { fakeInvitedUser } from '@data/user';
import { SignUpPage } from '@page-object-model/pages/auth/sign-up.page';
import { LoginPage } from '@page-object-model/pages/auth/login.page';
import { DashboardPage } from '@page-object-model/pages/dashboard.page';

test.describe('Invite organization', () => {
  // fixme: signup.cloudcasa.io guards the form with a required Google reCAPTCHA v2
  // (image challenge) — the Sign up button stays disabled until it is solved, so the
  // signup step cannot be automated. Expected: completeInvitedSignUp() submits the
  // form; actual: the form remains ng-invalid because of the `re-captcha#recaptcha`
  // control. Unblock: staging needs reCAPTCHA disabled or switched to Google's
  // always-pass test sitekey, then remove this fixme. The post-signup behavior
  // (auto-login vs. redirect to login) is undetermined for the same reason — the
  // login step below may need adjusting on first green attempt.
  test.fixme('Invited user can sign up via invitation link and sees proper organization', async ({
    ccApi,
    browser,
  }) => {
    // Unique email per run: accepting an invite permanently adds the user
    // to the organization, so a fixed address would collide on re-runs.
    const invitedUser = fakeInvitedUser();

    // Arrange through the API — sending the invitation through the UI is
    // already covered by invite-to-organization.spec.ts.
    const invitedAt = Date.now();
    await ccApi.inviteUser(invitedUser);
    const invitation = await getInvitation(invitedAt, invitedUser.email);
    expect(invitation.organization).toBe(invitedUser.organization);

    // The invited user acts in their own browser session, separate from the admin's.
    const invitedContext = await browser.newContext();
    const invitedUserPage = await invitedContext.newPage();

    const signUpPage = new SignUpPage(invitedUserPage);
    await signUpPage.goto(invitation.link);

    // Email, names and company arrive prefilled (and disabled) from the invitation
    await signUpPage.businessEmail.shouldHaveValue(invitedUser.email);
    await signUpPage.firstName.shouldHaveValue(invitedUser.firstName);
    await signUpPage.lastName.shouldHaveValue(invitedUser.lastName);
    await signUpPage.company.shouldHaveValue(invitedUser.organization);

    await signUpPage.completeInvitedSignUp(invitedUser.password, 'QA Engineer');

    // Log in as the invited user
    const loginPage = new LoginPage(invitedUserPage);
    await loginPage.goto(process.env.BASE_URL ?? 'https://home.cloudcasa.io');
    await loginPage.login(invitedUser.email, invitedUser.password);

    // The invited user should land on the dashboard of the inviting organization
    const dashboardPage = new DashboardPage(invitedUserPage);
    await invitedUserPage.waitForURL('**/dashboard**');
    await dashboardPage.shouldOpen();
    await dashboardPage.userHelpModal.closeModal();
    await dashboardPage.userMenu.checkHeaderOragnization(invitedUser.organization);

    await invitedContext.close();
  });
});
