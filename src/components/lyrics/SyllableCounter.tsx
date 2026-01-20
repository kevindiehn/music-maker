import { countSyllables, countWords } from '../../services/syllables';

interface SyllableCounterProps {
  line: string;
  targetSyllables?: number | null;
  targetWords?: number | null;
}

export function SyllableCounter({ line, targetSyllables, targetWords }: SyllableCounterProps) {
  const syllableCount = countSyllables(line);
  const wordCount = countWords(line);

  const syllableMatch = targetSyllables ? syllableCount === targetSyllables : true;
  const wordMatch = targetWords ? wordCount === targetWords : true;

  return (
    <div className="flex gap-3 text-xs">
      <span className={`${
        targetSyllables
          ? syllableMatch
            ? 'text-green-400'
            : 'text-yellow-400'
          : 'text-gray-400'
      }`}>
        {syllableCount} syl{targetSyllables && ` / ${targetSyllables}`}
      </span>
      <span className={`${
        targetWords
          ? wordMatch
            ? 'text-green-400'
            : 'text-yellow-400'
          : 'text-gray-400'
      }`}>
        {wordCount} words{targetWords && ` / ${targetWords}`}
      </span>
    </div>
  );
}
