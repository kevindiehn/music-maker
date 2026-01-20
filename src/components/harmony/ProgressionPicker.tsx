import { PROGRESSIONS } from '../../utils/musicTheory';

interface ProgressionPickerProps {
  selectedProgression: string | null;
  onSelect: (progressionName: string) => void;
  musicKey: string;
}

const PROGRESSION_DESCRIPTIONS: Record<string, string> = {
  'I-IV-V-I': 'Classic rock/pop progression',
  'I-V-vi-IV': 'Most popular pop progression (Axis)',
  'ii-V-I': 'Jazz standard turnaround',
  'I-vi-IV-V': '50s doo-wop progression',
  'vi-IV-I-V': 'Emotional pop progression',
  'I-IV-vi-V': 'Alternative pop progression',
};

export function ProgressionPicker({ selectedProgression, onSelect, musicKey }: ProgressionPickerProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Common Progressions in {musicKey}
      </label>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(PROGRESSIONS).map(([name]) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className={`p-3 rounded-lg text-left transition-colors ${
              selectedProgression === name
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div className="font-mono text-sm font-medium">{name}</div>
            <div className="text-xs opacity-70 mt-1">
              {PROGRESSION_DESCRIPTIONS[name] || 'Common progression'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
