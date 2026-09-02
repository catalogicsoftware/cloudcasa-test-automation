// spec: specs/configuration/user-management.md (TC-USR-002)
// seed: seed.spec.ts
import { test, expect } from '@fixtures/auth';
import { getInvitation, resetInbox } from '@utils/mailinator';
import { EMAIL_TEST_TIMEOUT } from '@data/timeouts';

test.describe('Invite organization', () => {
  test.describe.configure({ timeout: EMAIL_TEST_TIMEOUT });

  test('Check if user invited in proper organization', async ({
    loggedInPage,
    dashboardPage,
    configurationPage,
    usersConfigurationPage,
    invitedUser,
    cancelInvitationAfterTest,
    mailboxAccess,
  }) => {
    await dashboardPage.userHelpModal.closeModal();

    await dashboardPage.topNavigationBar.goToConfiguration();

    await configurationPage.shouldOpen();

    await configurationPage.configurationSideBar.goTo('Users');

    await usersConfigurationPage.shouldOpen();
    await usersConfigurationPage.inviteUser.click();
    await usersConfigurationPage.inviteUserDrawer.isOpen();

    // Wiping right before sending leaves getInvitation nothing to match but THIS email.
    const invitedAt = await resetInbox(invitedUser.email);
    await usersConfigurationPage.inviteUserDrawer.sendInvitation(invitedUser);

    // The sent invitation appears on the Invitations tab as PENDING
    await usersConfigurationPage.openInvitationsTab();
    await usersConfigurationPage.invitationsTable.shouldHaveRow(invitedUser.email);
    await usersConfigurationPage.invitationsTable.shouldHaveCellValue(
      invitedUser.email,
      'State',
      'PENDING',
    );

    const invitation = await getInvitation(invitedAt);
    expect(invitation.organization).toBe(invitedUser.organization);
  });
});
