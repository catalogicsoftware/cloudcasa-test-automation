export const capitalizeFirstLetter = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

type OkCheckable = { ok(): boolean; status(): number; text(): Promise<string> };

/** Shared by API clients (APIResponse) and page-factory click helpers (page Response) — both shapes match. */
export async function assertResponseOk(response: OkCheckable, label: string): Promise<void> {
  if (!response.ok()) {
    throw new Error(`${label} failed: ${response.status()} ${await response.text()}`);
  }
}

export const normalizeWhitespace = (str: string): string => str.replace(/\s+/g, ' ').trim();

export const normalizeLines = (str: string): string =>
  str
    .split('\n')
    .map(normalizeWhitespace)
    .filter(line => line.length > 0)
    .join('\n');
