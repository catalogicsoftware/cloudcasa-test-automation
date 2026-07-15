import { Page } from '@playwright/test';
import { Container } from '@page-fatory/container';
import { Input } from '@page-fatory/input';
import { Dropdown } from '@page-fatory/dropdown';
import { Button } from '@page-fatory/button';
import type { InvitedUser } from '../../../types/data/user';

export class InviteUserDrawer {
  readonly createInvitation: Container;
  readonly firstName: Input;
  readonly lastName: Input;
  readonly email: Input;
  readonly userGroups: Dropdown;
  readonly roles: Dropdown;
  readonly send: Button;
  readonly cancel: Button;

  constructor(protected readonly page: Page) {
    this.createInvitation = new Container({
      page,
      locator: 'app-create-invitation',
      name: 'Create Invitation',
    });
    this.firstName = new Input({
      page,
      locator: 'input[id*="input_first_name"]',
      name: 'First Name',
    });
    this.lastName = new Input({
      page: page,
      locator: 'input[id*="input_last_name"]',
      name: 'Last Name',
    });
    this.email = new Input({ page: page, locator: 'input[id*="input_email"]', name: 'Email' });
    this.userGroups = new Dropdown({
      page,
      locator:
        'app-create-invitation .form-group:has(label[for*="usergroups"]) button.mat-menu-trigger',
      name: 'User Groups',
    });
    this.roles = new Dropdown({
      page,
      locator: 'app-create-invitation .form-group:has(label[for*="roles"]) button.mat-menu-trigger',
      name: 'Roles',
    });
    this.send = new Button({ page: page, locator: 'button:text-is("Send")', name: 'Send' });
    this.cancel = new Button({ page: page, locator: 'button:has-text("Cancel")', name: 'Cancel' });
  }

  async isOpen(): Promise<void> {
    await this.createInvitation.shouldBeVisible();
  }

  async fillFirstName(firstName: string): Promise<void> {
    await this.firstName.fill(firstName, { validateValue: true });
  }

  async fillLastName(lastName: string): Promise<void> {
    await this.lastName.fill(lastName, { validateValue: true });
  }

  async fillEmail(email: string): Promise<void> {
    await this.email.fill(email, { validateValue: true });
  }

  async selectUserGroup(userGroup: string): Promise<void> {
    await this.userGroups.selectByText(userGroup);
    await this.userGroups.shouldHaveSelected(userGroup);
  }

  async selectRole(role: string): Promise<void> {
    await this.roles.selectByText(role);
    await this.roles.shouldHaveSelected(role);
  }
  async sendInvitation(user: InvitedUser): Promise<void> {
    await this.fillFirstName(user.firstName);
    await this.fillLastName(user.lastName);
    await this.fillEmail(user.email);
    if (user.userGroup) {
      await this.selectUserGroup(user.userGroup);
    }
    await this.selectRole(user.role);
    await this.send.shouldBeEnabled();
    await this.send.click();
  }
}
