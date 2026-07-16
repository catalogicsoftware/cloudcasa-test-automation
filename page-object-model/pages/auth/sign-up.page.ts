import { readFile } from 'fs/promises';
import { Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { Input } from '@page-fatory/input';
import { Checkbox } from '@page-fatory/checkbox';
import { Link } from '@page-fatory/link';
import { Button } from '@page-fatory/button';
import { extractPdfText } from '@utils/pdf';
import { compareText, TextComparisonResult } from '@utils/text-compare';

export class SignUpPage extends BasePage {
  readonly businessEmail = new Input({
    page: this.page,
    locator: '#email',
    name: 'Business Email',
  });

  readonly password = new Input({
    page: this.page,
    locator: '#password',
    name: 'Password',
  });

  readonly reEnterPassword = new Input({
    page: this.page,
    locator: '#confirmPassword',
    name: 'Re-enter password',
  });

  readonly firstName = new Input({
    page: this.page,
    locator: '#firstName',
    name: 'First Name',
  });

  readonly lastName = new Input({
    page: this.page,
    locator: '#lastName',
    name: 'Last Name',
  });

  readonly company = new Input({ page: this.page, locator: '#company', name: 'Company' });

  readonly jobTitle = new Input({
    page: this.page,
    locator: '#jobTitle',
    name: 'Job title',
  });

  readonly consentCheckbox = new Checkbox({
    page: this.page,
    locator: '#consentGiven',
    name: 'Privacy Policy',
  });

  readonly signUpButton = new Button({
    page: this.page,
    locator: 'form button[type="submit"]',
    name: 'Sign up',
  });

  readonly masterServiceAgreement = new Link({
    page: this.page,
    locator: 'role=link[name="Master Service Agreement"]',
    name: 'Master Service Agreement',
  });

  readonly privacyPolicy = new Link({
    page: this.page,
    locator: 'role=link[name="Privacy Policy"]',
    name: 'Privacy Policy',
  });

  constructor(page: Page) {
    super(page);
  }

  async goto(
    url: string = process.env.SIGNUP_URL || 'https://signup.cloudcasa.io/',
  ): Promise<void> {
    await super.goto(url);
  }

  async fillSignUpForm(
    businessEmail: string,
    password: string,
    firstName: string,
    lastName: string,
    company: string,
    jobTitle: string,
  ): Promise<void> {
    await this.businessEmail.fill(businessEmail);
    await this.password.fill(password);
    await this.reEnterPassword.fill(password);
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.company.fill(company);
    await this.jobTitle.fill(jobTitle);
  }

  // Invited signup: email/first name/last name/company arrive prefilled and
  // disabled via the invitation link's `prefillFields` payload, so only the
  // passwords, job title and consent are editable. The form also contains a
  // required reCAPTCHA which keeps the Sign up button disabled until solved.
  async completeInvitedSignUp(password: string, jobTitle: string): Promise<void> {
    await this.password.fill(password);
    await this.reEnterPassword.fill(password);
    await this.jobTitle.fill(jobTitle);
    await this.checkPrivacyPolicy();
    await this.signUpButton.click();
  }

  async checkPrivacyPolicy(): Promise<void> {
    await this.consentCheckbox.check();
  }

  async uncheckPrivacyPolicy(): Promise<void> {
    await this.consentCheckbox.check();
  }

  async openMasterServiceAgreement(): Promise<void> {
    await this.masterServiceAgreement.click();
  }

  async openPrivacyPolicy(): Promise<void> {
    await this.privacyPolicy.click();
  }

  async verifyMasterServiceAgreement(expectedPdfPath: string): Promise<TextComparisonResult> {
    const href = await this.masterServiceAgreement.getLocator().getAttribute('href');
    if (!href) {
      throw new Error('Master Service Agreement link has no href attribute');
    }

    const publishedPdfUrl = new URL(href, this.page.url()).toString();
    const [publishedPdfResponse, expectedPdfBuffer] = await Promise.all([
      fetch(publishedPdfUrl),
      readFile(expectedPdfPath),
    ]);
    const publishedPdfBuffer = await publishedPdfResponse.arrayBuffer();

    const [publishedText, expectedText] = await Promise.all([
      extractPdfText(publishedPdfBuffer),
      extractPdfText(expectedPdfBuffer),
    ]);

    return compareText(expectedText, publishedText);
  }

  async verifyPrivacyPolicy(expectedFilePath: string): Promise<TextComparisonResult> {
    const previousUrl = this.page.url();
    const popupPromise = this.page
      .context()
      .waitForEvent('page', { timeout: 5000 })
      .catch(() => null);

    await this.privacyPolicy.click();
    const popup = await popupPromise;
    const privacyPolicyPage = popup ?? this.page;
    await privacyPolicyPage.waitForLoadState('domcontentloaded');

    const [publishedText, expectedText] = await Promise.all([
      privacyPolicyPage.locator('body').innerText(),
      readFile(expectedFilePath, 'utf-8'),
    ]);

    if (popup) {
      await popup.close();
    } else {
      await this.page.goto(previousUrl, { waitUntil: 'domcontentloaded' });
    }

    return compareText(expectedText, publishedText);
  }
}
