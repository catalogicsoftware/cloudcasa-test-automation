const TESTMAIL_API_URL = 'https://api.testmail.app/api/json';
const RESET_EMAIL_SUBJECT = 'CloudCasa Password Change';
const RESET_LINK_PATTERN = /href="(https:\/\/[^"]*\/lo\/reset\?ticket=[^"]*)"/;

type TestmailEmail = {
  subject: string;
  html: string;
  timestamp: number;
};

type TestmailResponse = {
  result: string;
  emails: TestmailEmail[];
};

function resetPasswordTag(): string {
  const [localPart] = (process.env.RESET_PWD_EMAIL ?? '').split('@');
  const [, ...tagParts] = localPart.split('.');
  return tagParts.join('.');
}

// Auth0 sends the reset email asynchronously, so `afterTimestamp` (epoch ms, taken
// right before triggering the reset) combined with `livequery` lets us wait for that
// specific email instead of matching a stale one already sitting in the inbox.
export async function getPasswordResetLink(afterTimestamp: number): Promise<string> {
  const apiKey = process.env.TESTMAIL_API_KEY ?? '';
  const namespace = process.env.TESTMAIL_NAMESPACE ?? '';
  const tag = resetPasswordTag();

  const url =
    `${TESTMAIL_API_URL}?apikey=${apiKey}&namespace=${namespace}&tag=${tag}` +
    `&livequery=true&timestamp_from=${afterTimestamp}`;

  const response = await fetch(url);
  const data = (await response.json()) as TestmailResponse;

  const email = data.emails?.find(candidate => candidate.subject === RESET_EMAIL_SUBJECT);
  if (!email) {
    throw new Error(
      `No "${RESET_EMAIL_SUBJECT}" email received in testmail.app inbox after ${new Date(afterTimestamp).toISOString()}`,
    );
  }

  const match = email.html.match(RESET_LINK_PATTERN);
  if (!match) {
    throw new Error('Password reset link not found in email body');
  }

  return match[1];
}
