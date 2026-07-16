import { test, expect } from '@fixtures/auth';
import { getInvitation } from '@utils/testmail';

test.describe('Invite organization', () => {
  test('Check if user invited in proper organization', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    usersConfigurationPage,
    invitedUser,
    cancelInvitationAfterTest,
  }) => {
    await dashboardPage.userHelpModal.closeModal();

    await dashboardPage.topNavigationBar.goToConfiguration();

    await configurationPage.shouldOpen();

    await configurationPage.configurationSideBar.goTo('Users');

    await usersConfigurationPage.shouldOpen();
    await usersConfigurationPage.inviteUser.click();
    await usersConfigurationPage.inviteUserDrawer.isOpen();

    // Taken right before sending so getInvitation waits for THIS email,
    // not a stale one already sitting in the inbox.
    const invitedAt = Date.now();
    await usersConfigurationPage.inviteUserDrawer.sendInvitation(invitedUser);

    const invitation = await getInvitation(invitedAt);
    expect(invitation.organization).toBe(invitedUser.organization);
  });
});
