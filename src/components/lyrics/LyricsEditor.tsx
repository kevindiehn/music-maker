import type { SongSection } from '../../types';
import { SyllableCounter } from './SyllableCounter';

interface LyricsEditorProps {
  sections: SongSection[];
  onChange: (sections: SongSection[]) => void;
  targetSyllables?: number | null;
  targetWords?: number | null;
}

const SECTION_COLORS: Record<SongSection['type'], string> = {
  intro: 'border-purple-500',
  verse: 'border-blue-500',
  chorus: 'border-green-500',
  bridge: 'border-yellow-500',
  outro: 'border-red-500',
};

const SECTION_BG: Record<SongSection['type'], string> = {
  intro: 'bg-purple-500/10',
  verse: 'bg-blue-500/10',
  chorus: 'bg-green-500/10',
  bridge: 'bg-yellow-500/10',
  outro: 'bg-red-500/10',
};

export function LyricsEditor({ sections, onChange, targetSyllables, targetWords }: LyricsEditorProps) {
  const updateSectionLines = (sectionId: string, text: string) => {
    onChange(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, lines: text.split('\n') }
          : section
      )
    );
  };

  if (sections.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Add sections to your song structure above to start writing lyrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section, sectionIndex) => (
        <div
          key={section.id}
          className={`rounded-lg border-l-4 ${SECTION_COLORS[section.type]} ${SECTION_BG[section.type]}`}
        >
          <div className="px-4 py-2 border-b border-gray-700">
            <h3 className="text-sm font-medium text-gray-300">
              {section.type.charAt(0).toUpperCase() + section.type.slice(1)} {
                sections.filter((s, i) => s.type === section.type && i <= sectionIndex).length > 1
                  ? sections.filter((s, i) => s.type === section.type && i <= sectionIndex).length
                  : ''
              }
            </h3>
          </div>

          <div className="p-4">
            <textarea
              value={section.lines.join('\n')}
              onChange={(e) => updateSectionLines(section.id, e.target.value)}
              placeholder={`Write your ${section.type} lyrics here...`}
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none font-mono"
            />

            {section.lines.filter(l => l.trim()).length > 0 && (
              <div className="mt-2 space-y-1">
                {section.lines.map((line, lineIndex) => (
                  line.trim() && (
                    <div key={lineIndex} className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 truncate max-w-[60%]">
                        {lineIndex + 1}. {line}
                      </span>
                      <SyllableCounter
                        line={line}
                        targetSyllables={targetSyllables}
                        targetWords={targetWords}
                      />
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
