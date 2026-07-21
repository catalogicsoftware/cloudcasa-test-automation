// spec: specs/configuration/user-management.md (TC-USR-005, steps 1-2 — the
// rest of the scenario is blocked by a live reCAPTCHA on the signup form)
// seed: seed.spec.ts
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

    // Arrange through the API — sending the invitation through the UI is
    // already covered by invite-to-organization.spec.ts.
    const invitedAt = Date.now();
    await ccApi.inviteUser(invitedUser);

    // Fetch the invitation email and confirm it names the inviting organization.
    const invitation = await getInvitation(invitedAt, invitedUser.email);
    expect(invitation.organization).toBe(invitedUser.organization);

    // Follow the invitation link to the signup form.
    await signUpPage.goto(invitation.link);

    // Email, first name, last name and company arrive prefilled and locked
    // from the invitation link's `prefillFields` payload — the invitee cannot
    // sign up under a different identity.
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
