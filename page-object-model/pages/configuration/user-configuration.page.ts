import test, { expect, Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { Container } from '@page-fatory/container';
import { Link } from '@page-fatory/link';
import { Button } from '@page-fatory/button';
import { Table } from '@page-fatory/table';
import { InviteUserDrawer } from '@page-object-model/components/drawers/user-invitation-drawer.components';

export class UsersConfigurationPage extends BasePage {
  readonly usersContainer = new Container({ page: this.page, locator: 'app-users', name: 'Users' });
  readonly inviteUser = new Button({
    page: this.page,
    locator: 'button:has-text("Invite user")',
    name: 'Invite user',
  });
  readonly invitationsTab = new Link({
    page: this.page,
    locator: 'a:has-text("Invitations")',
    name: 'Invitations',
  });
  readonly inviteUserDrawer = new InviteUserDrawer(this.page);
  readonly invitationsTable = new Table({
    page: this.page,
    locator: 'app-invitations table',
    name: 'Invitations',
  });

  constructor(page: Page) {
    super(page);
  }

  async shouldOpen(): Promise<void> {
    await test.step('Users Configuration page should be opened', async () => {
      await expect(this.page).toHaveURL(/\/configuration\/users/);
      await this.usersContainer.shouldBeVisible();
    });
  }

  async openInvitationsTab(): Promise<void> {
    await this.invitationsTab.clickAndWaitForUrl(/\/configuration\/users\/invitations/);
  }
}
