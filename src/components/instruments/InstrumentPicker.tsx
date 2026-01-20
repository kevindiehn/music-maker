import type { Instrument } from '../../types';

interface InstrumentPickerProps {
  instruments: Instrument[];
  onChange: (instruments: Instrument[]) => void;
}

const AVAILABLE_INSTRUMENTS = [
  { id: 'piano', name: 'Piano', icon: '🎹', type: 'melody' as const },
  { id: 'synth-lead', name: 'Synth Lead', icon: '🎛️', type: 'melody' as const },
  { id: 'acoustic-guitar', name: 'Acoustic Guitar', icon: '🎸', type: 'chords' as const },
  { id: 'electric-guitar', name: 'Electric Guitar', icon: '⚡', type: 'chords' as const },
  { id: 'synth-pad', name: 'Synth Pad', icon: '🌊', type: 'chords' as const },
  { id: 'strings', name: 'Strings', icon: '🎻', type: 'chords' as const },
  { id: 'bass', name: 'Bass', icon: '🎸', type: 'bass' as const },
  { id: 'synth-bass', name: 'Synth Bass', icon: '💫', type: 'bass' as const },
  { id: 'drums', name: 'Drums', icon: '🥁', type: 'drums' as const },
];

export function InstrumentPicker({ instruments, onChange }: InstrumentPickerProps) {
  const toggleInstrument = (instrumentDef: typeof AVAILABLE_INSTRUMENTS[0]) => {
    const existing = instruments.find((i) => i.id === instrumentDef.id);

    if (existing) {
      onChange(instruments.filter((i) => i.id !== instrumentDef.id));
    } else {
      const newInstrument: Instrument = {
        id: instrumentDef.id,
        name: instrumentDef.name,
        type: instrumentDef.type,
        volume: 0.7,
        muted: false,
        solo: false,
      };
      onChange([...instruments, newInstrument]);
    }
  };

  const isSelected = (id: string) => instruments.some((i) => i.id === id);

  const groupedInstruments = {
    melody: AVAILABLE_INSTRUMENTS.filter((i) => i.type === 'melody'),
    chords: AVAILABLE_INSTRUMENTS.filter((i) => i.type === 'chords'),
    bass: AVAILABLE_INSTRUMENTS.filter((i) => i.type === 'bass'),
    drums: AVAILABLE_INSTRUMENTS.filter((i) => i.type === 'drums'),
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedInstruments).map(([group, groupInstruments]) => (
        <div key={group}>
          <h3 className="text-sm font-medium text-gray-400 mb-2 capitalize">
            {group === 'melody' ? 'Melody Instruments' :
             group === 'chords' ? 'Chord Instruments' :
             group === 'bass' ? 'Bass' : 'Percussion'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {groupInstruments.map((instrument) => (
              <button
                key={instrument.id}
                onClick={() => toggleInstrument(instrument)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isSelected(instrument.id)
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className="text-xl">{instrument.icon}</span>
                <span className="text-sm font-medium">{instrument.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {instruments.length === 0 && (
        <p className="text-gray-500 text-sm italic text-center py-4">
          Select instruments to add to your arrangement
        </p>
      )}
    </div>
  );
}
