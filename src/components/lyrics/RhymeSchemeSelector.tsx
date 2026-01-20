interface RhymeSchemeSelectorProps {
  value: string;
  onChange: (scheme: string) => void;
}

const PRESET_SCHEMES = [
  { value: 'ABAB', label: 'ABAB', description: 'Alternating rhymes' },
  { value: 'AABB', label: 'AABB', description: 'Couplets' },
  { value: 'ABBA', label: 'ABBA', description: 'Enclosed rhyme' },
  { value: 'ABCABC', label: 'ABCABC', description: 'Terza rima style' },
  { value: 'free', label: 'Free verse', description: 'No rhyme pattern' },
];

export function RhymeSchemeSelector({ value, onChange }: RhymeSchemeSelectorProps) {
  const isCustom = value && !PRESET_SCHEMES.some(s => s.value === value);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Rhyme Scheme
      </label>

      <div className="flex flex-wrap gap-2">
        {PRESET_SCHEMES.map((scheme) => (
          <button
            key={scheme.value}
            onClick={() => onChange(scheme.value)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              value === scheme.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={scheme.description}
          >
            {scheme.label}
          </button>
        ))}
        <button
          onClick={() => onChange(isCustom ? value : 'ABAB')}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
            isCustom
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Custom
        </button>
      </div>

      {isCustom && (
        <div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            placeholder="e.g., AABCCB"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use letters to indicate rhymes (A rhymes with A, B with B, etc.)
          </p>
        </div>
      )}
    </div>
  );
}
