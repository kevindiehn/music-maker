import { NOTES, CHORD_TYPES } from '../../utils/musicTheory';
import type { Chord } from '../../types';

interface ChordSelectorProps {
  chord: Chord | null;
  onChange: (chord: Chord) => void;
  onRemove?: () => void;
}

export function ChordSelector({ chord, onChange, onRemove }: ChordSelectorProps) {
  const handleRootChange = (root: string) => {
    onChange({
      root,
      type: chord?.type || 'major',
      duration: chord?.duration || '1n',
      startTime: chord?.startTime || '0:0:0',
    });
  };

  const handleTypeChange = (type: string) => {
    onChange({
      root: chord?.root || 'C',
      type,
      duration: chord?.duration || '1n',
      startTime: chord?.startTime || '0:0:0',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={chord?.root || 'C'}
        onChange={(e) => handleRootChange(e.target.value)}
        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
      >
        {NOTES.map((note) => (
          <option key={note} value={note}>{note}</option>
        ))}
      </select>

      <select
        value={chord?.type || 'major'}
        onChange={(e) => handleTypeChange(e.target.value)}
        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
      >
        {Object.keys(CHORD_TYPES).map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>

      {onRemove && (
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-400 transition-colors"
          title="Remove chord"
        >
          ×
        </button>
      )}
    </div>
  );
}
