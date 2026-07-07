import { diffLines } from 'diff';
import { normalizeLines } from './generic';

export type TextComparisonResult = {
  matches: boolean;
  differences: string[];
};

export function compareText(expectedText: string, actualText: string): TextComparisonResult {
  const differences = diffLines(normalizeLines(expectedText), normalizeLines(actualText))
    .filter(part => part.added || part.removed)
    .map(part => `${part.added ? '+' : '-'} ${part.value.trim()}`);

  return { matches: differences.length === 0, differences };
}
