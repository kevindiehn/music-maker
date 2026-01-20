import type { Chord } from '../../types';
import { ChordSelector } from './ChordSelector';

interface ChordDisplayProps {
  chords: Chord[];
  onChange: (chords: Chord[]) => void;
  bars: number;
}

const CHORD_COLORS: Record<string, string> = {
  major: 'bg-blue-600',
  minor: 'bg-purple-600',
  dim: 'bg-red-600',
  aug: 'bg-orange-600',
  '7': 'bg-green-600',
  maj7: 'bg-teal-600',
  min7: 'bg-indigo-600',
  sus2: 'bg-yellow-600',
  sus4: 'bg-pink-600',
};

export function ChordDisplay({ chords, onChange, bars }: ChordDisplayProps) {
  const updateChord = (index: number, chord: Chord) => {
    const newChords = [...chords];
    newChords[index] = chord;
    onChange(newChords);
  };

  const removeChord = (index: number) => {
    onChange(chords.filter((_, i) => i !== index));
  };

  const addChord = () => {
    const lastChord = chords[chords.length - 1];
    const newChord: Chord = {
      root: lastChord?.root || 'C',
      type: lastChord?.type || 'major',
      duration: '1n',
      startTime: `${chords.length}:0:0`,
    };
    onChange([...chords, newChord]);
  };

  // Calculate which bar each chord is in
  const chordsPerBar = Math.max(1, Math.ceil(chords.length / bars));

  return (
    <div className="space-y-4">
      {/* Visual chord timeline */}
      <div className="flex gap-1">
        {Array.from({ length: bars }).map((_, barIndex) => {
          const barChords = chords.slice(
            barIndex * chordsPerBar,
            (barIndex + 1) * chordsPerBar
          );

          return (
            <div
              key={barIndex}
              className="flex-1 min-w-0 border border-gray-600 rounded-lg p-2 bg-gray-800"
            >
              <div className="text-xs text-gray-500 mb-1">Bar {barIndex + 1}</div>
              <div className="flex gap-1">
                {barChords.length > 0 ? (
                  barChords.map((chord, i) => {
                    const globalIndex = barIndex * chordsPerBar + i;
                    return (
                      <div
                        key={globalIndex}
                        className={`flex-1 p-2 rounded text-center text-white text-sm font-medium ${
                          CHORD_COLORS[chord.type] || 'bg-gray-600'
                        }`}
                      >
                        {chord.root}
                        <span className="text-xs opacity-80">{chord.type}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 p-2 rounded text-center text-gray-500 text-sm border border-dashed border-gray-600">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chord list editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">
            Chord Sequence ({chords.length} chords)
          </label>
          <button
            onClick={addChord}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          >
            + Add Chord
          </button>
        </div>

        {chords.length === 0 ? (
          <p className="text-gray-500 text-sm italic py-4 text-center">
            Select a progression above or add chords manually
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {chords.map((chord, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  CHORD_COLORS[chord.type] || 'bg-gray-600'
                }`}
              >
                <span className="text-xs text-white/60">{index + 1}.</span>
                <ChordSelector
                  chord={chord}
                  onChange={(newChord) => updateChord(index, newChord)}
                  onRemove={() => removeChord(index)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
