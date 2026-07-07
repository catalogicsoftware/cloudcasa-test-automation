export const capitalizeFirstLetter = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const normalizeWhitespace = (str: string): string => str.replace(/\s+/g, ' ').trim();

export const normalizeLines = (str: string): string =>
  str
    .split('\n')
    .map(normalizeWhitespace)
    .filter(line => line.length > 0)
    .join('\n');
