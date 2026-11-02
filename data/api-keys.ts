/** A built-in role, so the key needs no custom role prepared first. */
export const API_KEY_ROLE = 'ADMIN';

/** The table shows only the last characters of a key, behind a fixed mask; a key holds no regex metacharacters. */
export const maskedApiKey = (secret: string): RegExp => new RegExp(`\\*{8}${secret.slice(-5)}`);

/** The Created cell prints the en-US date and time (`11/2/26, 8:21 PM`); the minute is left open so a tick between save and read cannot fail it. */
export const createdOn = (date: Date): RegExp => {
  const day = date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  });
  return new RegExp(`${day}, \\d{1,2}:\\d{2} [AP]M`);
};

export type ApiKeyQuota = { created: number; limit: number };

/** The quota heading's own text, matched whole: a substring match would let "2 of 64" pass on "12 of 64". */
export const apiKeyQuotaText = ({ created, limit }: ApiKeyQuota): string =>
  `${created} of ${limit} created`;
