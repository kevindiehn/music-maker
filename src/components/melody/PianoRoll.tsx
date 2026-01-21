import type { Note, SongSection } from '../../types';
import { extractAllWords } from '../../services/syllables';

interface PianoRollProps {
  notes: Note[];
  onChange: (notes: Note[]) => void;
  bars?: number;
  lyrics?: SongSection[];
}

const PIANO_NOTES = [
  'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4',
  'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'
];

const isBlackKey = (note: string) => note.includes('#');

export function PianoRoll({ notes, onChange, bars = 4, lyrics = [] }: PianoRollProps) {
  const beatsPerBar = 4;
  const totalBeats = bars * beatsPerBar;
  const subdivisions = 4; // 16th notes
  const totalCells = totalBeats * subdivisions;

  // Extract all words from lyrics and sort notes by time for mapping
  const allWords = lyrics.flatMap((section) => extractAllWords(section.lines));
  const sortedNotes = [...notes].sort((a, b) => {
    const parseTime = (t: string) => {
      const [bar, beat, sixteenth] = t.split(':').map(Number);
      return bar * 16 + beat * 4 + sixteenth;
    };
    return parseTime(a.startTime) - parseTime(b.startTime);
  });

  // Create a map of startTime -> word for display
  const noteToWord = new Map<string, string>();
  sortedNotes.forEach((note, index) => {
    if (index < allWords.length) {
      noteToWord.set(`${note.pitch}-${note.startTime}`, allWords[index]);
    }
  });

  const toggleNote = (pitch: string, cellIndex: number) => {
    const startTime = `0:${Math.floor(cellIndex / subdivisions)}:${(cellIndex % subdivisions) * (subdivisions / 4)}`;
    const existingIndex = notes.findIndex(
      (n) => n.pitch === pitch && n.startTime === startTime
    );

    if (existingIndex >= 0) {
      onChange(notes.filter((_, i) => i !== existingIndex));
    } else {
      const newNote: Note = {
        pitch,
        duration: '16n',
        startTime,
      };
      onChange([...notes, newNote]);
    }
  };

  const isNoteActive = (pitch: string, cellIndex: number) => {
    const startTime = `0:${Math.floor(cellIndex / subdivisions)}:${(cellIndex % subdivisions) * (subdivisions / 4)}`;
    return notes.some((n) => n.pitch === pitch && n.startTime === startTime);
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Header with beat numbers */}
        <div className="flex">
          <div className="w-12 shrink-0" />
          {Array.from({ length: totalBeats }).map((_, beatIndex) => (
            <div
              key={beatIndex}
              className="text-xs text-gray-500 text-center border-l border-gray-700"
              style={{ width: `${subdivisions * 20}px` }}
            >
              {beatIndex + 1}
            </div>
          ))}
        </div>

        {/* Piano roll grid */}
        {PIANO_NOTES.map((pitch) => (
          <div key={pitch} className="flex">
            {/* Piano key label */}
            <div
              className={`w-12 shrink-0 px-2 py-1 text-xs font-mono border-r border-gray-600 flex items-center justify-end ${
                isBlackKey(pitch) ? 'bg-gray-800 text-gray-400' : 'bg-gray-700 text-white'
              }`}
            >
              {pitch}
            </div>

            {/* Note cells */}
            {Array.from({ length: totalCells }).map((_, cellIndex) => {
              const isBarStart = cellIndex % (beatsPerBar * subdivisions) === 0;
              const isBeatStart = cellIndex % subdivisions === 0;
              const active = isNoteActive(pitch, cellIndex);

              return (
                <div
                  key={cellIndex}
                  onClick={() => toggleNote(pitch, cellIndex)}
                  className={`w-5 h-6 border-r border-b cursor-pointer transition-colors ${
                    isBarStart
                      ? 'border-l-2 border-l-gray-500'
                      : isBeatStart
                      ? 'border-l border-l-gray-600'
                      : 'border-l border-l-gray-700/50'
                  } ${
                    active
                      ? 'bg-indigo-500 hover:bg-indigo-400'
                      : isBlackKey(pitch)
                      ? 'bg-gray-800 hover:bg-gray-700'
                      : 'bg-gray-750 hover:bg-gray-700'
                  } border-gray-700`}
                />
              );
            })}
          </div>
        ))}

        {/* Lyrics row */}
        {allWords.length > 0 && (
          <div className="flex border-t-2 border-indigo-500 mt-1">
            <div className="w-12 shrink-0 px-1 py-1 text-xs text-gray-400 border-r border-gray-600 bg-gray-800">
              Lyrics
            </div>
            {Array.from({ length: totalCells }).map((_, cellIndex) => {
              const startTime = `0:${Math.floor(cellIndex / subdivisions)}:${(cellIndex % subdivisions) * (subdivisions / 4)}`;
              // Find if any note at this cell has a word
              const wordAtCell = PIANO_NOTES.map((pitch) =>
                noteToWord.get(`${pitch}-${startTime}`)
              ).find(Boolean);
              const isBarStart = cellIndex % (beatsPerBar * subdivisions) === 0;

              return (
                <div
                  key={cellIndex}
                  className={`w-5 h-6 flex items-center justify-center text-[9px] overflow-hidden ${
                    isBarStart ? 'border-l-2 border-l-gray-500' : 'border-l border-l-gray-700/50'
                  } ${wordAtCell ? 'bg-indigo-900/50 text-indigo-300' : 'bg-gray-800/50'}`}
                  title={wordAtCell || ''}
                >
                  {wordAtCell && (
                    <span className="truncate px-0.5">{wordAtCell}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Lyrics summary */}
        {allWords.length > 0 && (
          <div className="mt-2 px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">
            {allWords.length} words • {notes.length} notes
            {allWords.length !== notes.length && (
              <span className="text-yellow-500 ml-2">
                ({allWords.length > notes.length ? `${allWords.length - notes.length} more words than notes` : `${notes.length - allWords.length} more notes than words`})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
