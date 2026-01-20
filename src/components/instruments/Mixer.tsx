import type { Instrument } from '../../types';

interface MixerProps {
  instruments: Instrument[];
  onChange: (instruments: Instrument[]) => void;
}

const INSTRUMENT_COLORS: Record<string, string> = {
  'piano': 'bg-blue-600',
  'synth-lead': 'bg-purple-600',
  'acoustic-guitar': 'bg-amber-600',
  'electric-guitar': 'bg-red-600',
  'synth-pad': 'bg-teal-600',
  'strings': 'bg-rose-600',
  'bass': 'bg-green-600',
  'synth-bass': 'bg-emerald-600',
  'drums': 'bg-orange-600',
};

export function Mixer({ instruments, onChange }: MixerProps) {
  const updateInstrument = (id: string, updates: Partial<Instrument>) => {
    onChange(
      instruments.map((inst) =>
        inst.id === id ? { ...inst, ...updates } : inst
      )
    );
  };

  const handleSolo = (id: string) => {
    const instrument = instruments.find((i) => i.id === id);
    if (!instrument) return;

    if (instrument.solo) {
      // Un-solo: just turn off solo for this one
      updateInstrument(id, { solo: false });
    } else {
      // Solo: turn on solo for this one, turn off for others
      onChange(
        instruments.map((inst) => ({
          ...inst,
          solo: inst.id === id,
        }))
      );
    }
  };

  if (instruments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No instruments selected</p>
        <p className="text-sm mt-1">Add instruments above to see the mixer</p>
      </div>
    );
  }

  const hasSolo = instruments.some((i) => i.solo);

  return (
    <div className="space-y-3">
      {instruments.map((instrument) => {
        const isAudible = !instrument.muted && (!hasSolo || instrument.solo);

        return (
          <div
            key={instrument.id}
            className={`flex items-center gap-4 p-3 rounded-lg transition-opacity ${
              INSTRUMENT_COLORS[instrument.id] || 'bg-gray-600'
            } ${isAudible ? 'opacity-100' : 'opacity-50'}`}
          >
            {/* Instrument name */}
            <div className="w-32 font-medium text-white truncate">
              {instrument.name}
            </div>

            {/* Mute button */}
            <button
              onClick={() => updateInstrument(instrument.id, { muted: !instrument.muted })}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                instrument.muted
                  ? 'bg-red-500 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              M
            </button>

            {/* Solo button */}
            <button
              onClick={() => handleSolo(instrument.id)}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                instrument.solo
                  ? 'bg-yellow-500 text-black'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              S
            </button>

            {/* Volume slider */}
            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={instrument.volume}
                onChange={(e) =>
                  updateInstrument(instrument.id, { volume: parseFloat(e.target.value) })
                }
                className="flex-1 accent-white"
              />
              <span className="w-12 text-right text-sm text-white/80">
                {Math.round(instrument.volume * 100)}%
              </span>
            </div>

            {/* Type indicator */}
            <div className="text-xs text-white/60 w-16 text-right capitalize">
              {instrument.type}
            </div>
          </div>
        );
      })}

      {/* Master controls */}
      <div className="flex gap-2 pt-2 border-t border-gray-700">
        <button
          onClick={() => onChange(instruments.map((i) => ({ ...i, muted: false, solo: false })))}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
        >
          Reset All
        </button>
        <button
          onClick={() => onChange(instruments.map((i) => ({ ...i, volume: 0.7 })))}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
        >
          Reset Volumes
        </button>
      </div>
    </div>
  );
}
