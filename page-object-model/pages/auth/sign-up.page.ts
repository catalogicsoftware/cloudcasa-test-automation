import { readFile } from 'fs/promises';
import { Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { Input } from '@page-factory/input';
import { Link } from '@page-factory/link';
import { Button } from '@page-factory/button';
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

  async openMasterServiceAgreement(): Promise<void> {
    await this.masterServiceAgreement.click();
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
}
