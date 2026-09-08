import { MailinatorInbox, mailboxAddress } from '@data/mailinator-inboxes';
import { EMAIL_DELIVERY_TIMEOUT } from '@data/timeouts';

const DEFAULT_API_URL = 'https://mailinator.com/api/v2';

// The documented `wait` long-poll and the stream endpoint both answer 400 on the Verified Pro
// plan, so arrival is detected by polling.
const POLL_INTERVAL = 2_000;

const RESET_EMAIL_SUBJECT = 'CloudCasa Password Change';
const RESET_LINK_PATTERN = /href="(https:\/\/[^"]*\/lo\/reset\?ticket=[^"]*)"/;

// The invitation email links to the signup page with prefilled user data
// (base64 JSON in `prefillFields`). The href in that email is unquoted and
// `=` signs are HTML-encoded as `&#61;`, hence the loose pattern.
const INVITATION_EMAIL_SUBJECT = /invit/i;
const INVITATION_LINK_PATTERN = /href=["']?(https:\/\/signup\.[^"'\s>]*\?prefillFields[^"'\s>]*)/;
// "...invited by John Doe to join the <strong ...>CC AQA Organization</strong> organization..."
const INVITATION_ORGANIZATION_PATTERN = /join the\s*<strong[^>]*>([^<]+)<\/strong>\s*organization/;

type MessageSummary = {
  id: string;
  subject: string;
  time: number;
};

type InboxResponse = {
  msgs?: MessageSummary[];
};

export type Invitation = {
  link: string;
  organization: string;
};

function inboxFromEmail(email: string): string {
  return email.split('@')[0];
}

function apiUrl(path: string): string {
  const base = process.env.MAILINATOR_API_URL ?? DEFAULT_API_URL;
  return `${base}/domains/${process.env.MAILINATOR_DOMAIN}${path}`;
}

// The token goes in the header rather than the documented `?token=` so it cannot reach
// run artifacts through a logged URL.
async function callApi<T>(path: string, init: RequestInit & { timeout: number }): Promise<T> {
  const { timeout, ...options } = init;
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: { Authorization: process.env.MAILINATOR_API_TOKEN ?? '' },
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) {
    throw new Error(`Mailinator answered ${response.status} for ${path}: ${await response.text()}`);
  }

  return (await response.json()) as T;
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const matchesSubject = (candidate: string, subject: string | RegExp): boolean =>
  typeof subject === 'string' ? candidate === subject : subject.test(candidate);

/** Clears the inbox and returns the moment it became empty, which bounds the wait that follows. */
export async function resetInbox(address: string): Promise<number> {
  await callApi(`/inboxes/${inboxFromEmail(address)}`, { method: 'DELETE', timeout: 30_000 });
  return Date.now();
}

async function waitForEmail(options: {
  inbox: string;
  subject: string | RegExp;
  afterTimestamp: number;
}): Promise<MessageSummary> {
  const { inbox, subject, afterTimestamp } = options;
  const deadline = Date.now() + EMAIL_DELIVERY_TIMEOUT;

  while (Date.now() < deadline) {
    const { msgs } = await callApi<InboxResponse>(`/inboxes/${inbox}?sort=descending`, {
      timeout: 15_000,
    });

    const email = msgs?.find(
      candidate => candidate.time >= afterTimestamp && matchesSubject(candidate.subject, subject),
    );
    if (email) {
      return email;
    }

    await sleep(POLL_INTERVAL);
  }

  throw new Error(
    `No "${subject}" email in Mailinator inbox "${inbox}" within ${EMAIL_DELIVERY_TIMEOUT / 1000}s ` +
      `(waited from ${new Date(afterTimestamp).toISOString()})`,
  );
}

async function emailHtml(id: string): Promise<string> {
  const body = await callApi<Record<string, string>>(`/messages/${id}/texthtml`, {
    timeout: 30_000,
  });

  return body['text/html'] ?? '';
}

function extractLink(html: string, subject: string, linkPattern: RegExp): string {
  const match = html.match(linkPattern);
  if (!match) {
    throw new Error(`Link matching ${linkPattern} not found in "${subject}" email body`);
  }

  // Hrefs in email HTML may carry encoded entities (`&#61;` for `=`, `&amp;`).
  return match[1].replace(/&#61;/g, '=').replace(/&amp;/g, '&');
}

/** Verifies the API token and domain up front, so a bad one fails the run instead of a 90s email wait. */
export async function checkMailboxAccess(): Promise<void> {
  if (!process.env.MAILINATOR_DOMAIN || !process.env.MAILINATOR_API_TOKEN) {
    throw new Error('MAILINATOR_DOMAIN and MAILINATOR_API_TOKEN must be set — see .env.example');
  }

  try {
    await callApi(`/inboxes/${MailinatorInbox.RESET_PWD}?limit=1`, { timeout: 30_000 });
  } catch (error) {
    throw new Error(
      `Mailinator access check failed: ${(error as Error).message}. ` +
        'Regenerate MAILINATOR_API_TOKEN in the Mailinator UI or check MAILINATOR_DOMAIN.',
      { cause: error },
    );
  }
}

export async function getPasswordResetLink(afterTimestamp: number): Promise<string> {
  const email = await waitForEmail({
    inbox: MailinatorInbox.RESET_PWD,
    subject: RESET_EMAIL_SUBJECT,
    afterTimestamp,
  });

  return extractLink(await emailHtml(email.id), email.subject, RESET_LINK_PATTERN);
}

export async function getInvitation(
  afterTimestamp: number,
  invitedEmail: string = mailboxAddress(MailinatorInbox.INVITE_PENDING),
): Promise<Invitation> {
  const email = await waitForEmail({
    inbox: inboxFromEmail(invitedEmail),
    subject: INVITATION_EMAIL_SUBJECT,
    afterTimestamp,
  });

  const html = await emailHtml(email.id);

  const organizationMatch = html.match(INVITATION_ORGANIZATION_PATTERN);
  if (!organizationMatch) {
    throw new Error(`Organization name not found in "${email.subject}" email body`);
  }

  return {
    link: extractLink(html, email.subject, INVITATION_LINK_PATTERN),
    organization: organizationMatch[1].trim(),
  };
}
