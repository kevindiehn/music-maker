import type { Note } from '../../types';

interface PianoRollProps {
  notes: Note[];
  onChange: (notes: Note[]) => void;
  bars?: number;
}

const PIANO_NOTES = [
  'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4',
  'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'
];

const isBlackKey = (note: string) => note.includes('#');

export function PianoRoll({ notes, onChange, bars = 4 }: PianoRollProps) {
  const beatsPerBar = 4;
  const totalBeats = bars * beatsPerBar;
  const subdivisions = 4; // 16th notes
  const totalCells = totalBeats * subdivisions;

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
      </div>
    </div>
  );
}
