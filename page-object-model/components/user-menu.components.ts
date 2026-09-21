import { Page } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Title } from '@page-factory/title';

export class UserMenu {
  // Header button showing the user's first name and current organization —
  // visible even when the menu is closed. Clicking it opens the organization list.
  readonly userAndOrganizationButton: Button;

  readonly headerUserName: Title;
  readonly headerOrganization: Title;
  readonly userMenuEmail: Title;
  readonly userMenuOrganization: Title;
  readonly logoutButton: Button;
  readonly darkModeToggle: Button;

  constructor(private readonly page: Page) {
    this.userAndOrganizationButton = new Button({
      page,
      locator: 'button:has(.holder-name)',
      name: 'User and Organization',
    });
    this.headerUserName = new Title({
      page,
      locator: '.holder-name',
      name: 'Header User Name',
    });
    this.headerOrganization = new Title({
      page,
      locator: '.holder-org',
      name: 'Header Organization',
    });
    this.userMenuEmail = new Title({
      page,
      locator: '.navigation-user-info > small',
      name: 'User Menu Email',
    });
    this.userMenuOrganization = new Title({
      page,
      locator: '//span[contains(@class,"pl-3")]',
      name: 'User Menu Organization',
    });
    // The menu's items are all plain mat-menu-item buttons with no unique class or id,
    // so the item is addressed by its text, same as the main nav links in TopNav.
    this.logoutButton = new Button({
      page,
      locator: '.sidebar-menu button:has-text("Logout")',
      name: 'Logout',
    });
    // The checkbox behind the switch is display:none (styled via its label), so the
    // label is the clickable, visible element a real user acts on.
    this.darkModeToggle = new Button({
      page,
      locator: 'label[for="dark-mode-toggle"]',
      name: 'Dark mode',
    });
  }

  async isOpen(): Promise<boolean> {
    const classAttr = await this.page.locator('.sidebar-menu').getAttribute('class');
    return classAttr?.includes('active') ?? false;
  }

  async open(): Promise<void> {
    await this.userAndOrganizationButton.click();
  }

  async checkHeaderOragnization(oraganizationName: string): Promise<void> {
    await this.headerOrganization.shouldHaveText(oraganizationName);
  }

  async checkUserMenuOraganization(organzationName: string): Promise<void> {
    await this.userMenuOrganization.shouldHaveText(organzationName);
  }

  async checkUserMenuEmail(email: string) {
    await this.userMenuEmail.shouldHaveText(email);
  }

  async logout(): Promise<void> {
    await this.logoutButton.clickAndWaitForUrl(/\/login/);
  }

  async isDarkModeOn(): Promise<boolean> {
    return this.page.locator('#dark-mode-toggle').isChecked();
  }

  async setDarkMode(enabled: boolean): Promise<void> {
    if ((await this.isDarkModeOn()) !== enabled) {
      await this.darkModeToggle.click();
    }
  }
}
