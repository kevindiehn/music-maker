import { syllable } from 'syllable';

export function countSyllables(text: string): number {
  return syllable(text);
}

export function countSyllablesPerLine(lines: string[]): number[] {
  return lines.map((line) => countSyllables(line));
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countWordsPerLine(lines: string[]): number[] {
  return lines.map((line) => countWords(line));
}
