import { SCALES, NOTES } from '../../utils/musicTheory';

interface MelodyConfigProps {
  config: {
    key: string;
    scale: string;
    tempo: number;
    timeSignature: [number, number];
  };
  onChange: (config: MelodyConfigProps['config']) => void;
}

const TIME_SIGNATURES: [number, number][] = [
  [4, 4],
  [3, 4],
  [6, 8],
  [2, 4],
];

export function MelodyConfig({ config, onChange }: MelodyConfigProps) {
  const updateField = <K extends keyof typeof config>(field: K, value: typeof config[K]) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Key
          </label>
          <select
            value={config.key}
            onChange={(e) => updateField('key', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            {NOTES.map((note) => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Scale
          </label>
          <select
            value={config.scale}
            onChange={(e) => updateField('scale', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            {Object.keys(SCALES).map((scale) => (
              <option key={scale} value={scale}>
                {scale.charAt(0).toUpperCase() + scale.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Tempo (BPM)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={60}
              max={180}
              value={config.tempo}
              onChange={(e) => updateField('tempo', Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-white w-12 text-right">{config.tempo}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Time Signature
          </label>
          <select
            value={`${config.timeSignature[0]}/${config.timeSignature[1]}`}
            onChange={(e) => {
              const [num, denom] = e.target.value.split('/').map(Number);
              updateField('timeSignature', [num, denom] as [number, number]);
            }}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            {TIME_SIGNATURES.map(([num, denom]) => (
              <option key={`${num}/${denom}`} value={`${num}/${denom}`}>
                {num}/{denom}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-3 bg-gray-700/50 rounded-lg">
        <p className="text-sm text-gray-400">
          Current: <span className="text-white font-medium">{config.key} {config.scale}</span> at{' '}
          <span className="text-white font-medium">{config.tempo} BPM</span> in{' '}
          <span className="text-white font-medium">{config.timeSignature[0]}/{config.timeSignature[1]}</span>
        </p>
      </div>
    </div>
  );
}
