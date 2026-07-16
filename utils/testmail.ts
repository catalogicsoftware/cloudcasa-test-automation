import { TestmailTag, testmailAddress } from '@data/testmail-tags';

const RESET_EMAIL_SUBJECT = 'CloudCasa Password Change';
const RESET_LINK_PATTERN = /href="(https:\/\/[^"]*\/lo\/reset\?ticket=[^"]*)"/;

// The invitation email links to the signup page with prefilled user data
// (base64 JSON in `prefillFields`). The href in that email is unquoted and
// `=` signs are HTML-encoded as `&#61;`, hence the loose pattern.
const INVITATION_EMAIL_SUBJECT = /invit/i;
const INVITATION_LINK_PATTERN = /href=["']?(https:\/\/signup\.[^"'\s>]*\?prefillFields[^"'\s>]*)/;
// "...invited by John Doe to join the <strong ...>CC AQA Organization</strong> organization..."
const INVITATION_ORGANIZATION_PATTERN = /join the\s*<strong[^>]*>([^<]+)<\/strong>\s*organization/;

type TestmailEmail = {
  subject: string;
  html: string;
  timestamp: number;
};

type TestmailResponse = {
  result: string;
  emails: TestmailEmail[];
};

export type Invitation = {
  link: string;
  organization: string;
};

// testmail.app addresses look like `namespace.tag@inbox.testmail.app`;
// the API filters the inbox by that tag.
function tagFromEmail(email: string): string {
  const [localPart] = email.split('@');
  const [, ...tagParts] = localPart.split('.');
  return tagParts.join('.');
}

// Emails are sent asynchronously, so `afterTimestamp` (epoch ms, taken right
// before triggering the email) combined with `livequery` lets us wait for that
// specific email instead of matching a stale one already sitting in the inbox.
async function waitForEmail(options: {
  tag: string;
  subject: string | RegExp;
  afterTimestamp: number;
}): Promise<TestmailEmail> {
  const { tag, subject, afterTimestamp } = options;
  const apiKey = process.env.TESTMAIL_API_KEY ?? '';
  const namespace = process.env.TESTMAIL_NAMESPACE ?? '';

  const url =
    `${process.env.TESTMAIL_API_URL}?apikey=${apiKey}&namespace=${namespace}&tag=${tag}` +
    `&livequery=true&timestamp_from=${afterTimestamp}`;

  const response = await fetch(url);
  const data = (await response.json()) as TestmailResponse;

  const email = data.emails?.find(candidate =>
    typeof subject === 'string' ? candidate.subject === subject : subject.test(candidate.subject),
  );
  if (!email) {
    throw new Error(
      `No "${subject}" email received in testmail.app inbox "${tag}" after ${new Date(afterTimestamp).toISOString()}`,
    );
  }

  return email;
}

function extractLink(email: TestmailEmail, linkPattern: RegExp): string {
  const match = email.html.match(linkPattern);
  if (!match) {
    throw new Error(`Link matching ${linkPattern} not found in "${email.subject}" email body`);
  }

  // Hrefs in email HTML may carry encoded entities (`&#61;` for `=`, `&amp;`).
  return match[1].replace(/&#61;/g, '=').replace(/&amp;/g, '&');
}

export async function getPasswordResetLink(afterTimestamp: number): Promise<string> {
  const email = await waitForEmail({
    tag: TestmailTag.RESET_PWD,
    subject: RESET_EMAIL_SUBJECT,
    afterTimestamp,
  });

  return extractLink(email, RESET_LINK_PATTERN);
}

export async function getInvitation(
  afterTimestamp: number,
  invitedEmail: string = testmailAddress(TestmailTag.INVITE_PENDING),
): Promise<Invitation> {
  const email = await waitForEmail({
    tag: tagFromEmail(invitedEmail),
    subject: INVITATION_EMAIL_SUBJECT,
    afterTimestamp,
  });

  const organizationMatch = email.html.match(INVITATION_ORGANIZATION_PATTERN);
  if (!organizationMatch) {
    throw new Error(`Organization name not found in "${email.subject}" email body`);
  }

  return {
    link: extractLink(email, INVITATION_LINK_PATTERN),
    organization: organizationMatch[1].trim(),
  };
}
