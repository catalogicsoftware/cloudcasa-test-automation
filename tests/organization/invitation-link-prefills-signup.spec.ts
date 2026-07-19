import { test, expect } from '@fixtures/auth';
import { getInvitation } from '@utils/testmail';
import { fakeInvitedUser } from '@data/user';

test.describe('Invite organization', () => {
  test('Invitation link opens sign-up page with prefilled user data', async ({
    ccApi,
    signUpPage,
    cancelSignupInvitationAfterTest,
  }) => {
    const invitedUser = fakeInvitedUser();

    const invitedAt = Date.now();
    await ccApi.inviteUser(invitedUser);
    const invitation = await getInvitation(invitedAt, invitedUser.email);
    expect(invitation.organization).toBe(invitedUser.organization);

    await signUpPage.goto(invitation.link);

    await signUpPage.businessEmail.shouldHaveValue(invitedUser.email);
    await signUpPage.businessEmail.shouldBeDisabled();
    await signUpPage.firstName.shouldHaveValue(invitedUser.firstName);
    await signUpPage.firstName.shouldBeDisabled();
    await signUpPage.lastName.shouldHaveValue(invitedUser.lastName);
    await signUpPage.lastName.shouldBeDisabled();
    await signUpPage.company.shouldHaveValue(invitedUser.organization);
    await signUpPage.company.shouldBeDisabled();
  });
});
