import { generateRandomTopic } from '../../services/topics';

interface LyricsConfigProps {
  config: {
    theme: string;
    mood: string;
    genre: string;
    syllablesPerLine: number | null;
    wordsPerLine: number | null;
  };
  onChange: (config: LyricsConfigProps['config']) => void;
}

const MOODS = ['Happy', 'Sad', 'Energetic', 'Melancholic', 'Romantic', 'Angry', 'Peaceful', 'Nostalgic', 'Hopeful', 'Defiant', 'Chill'];
const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Country', 'R&B', 'Folk', 'Jazz', 'Electronic', 'Reggae', 'Soul', 'Indie'];

export function LyricsConfig({ config, onChange }: LyricsConfigProps) {
  const updateField = <K extends keyof typeof config>(field: K, value: typeof config[K]) => {
    onChange({ ...config, [field]: value });
  };

  const handleSurpriseMe = () => {
    const randomTopic = generateRandomTopic();
    onChange({
      ...config,
      theme: randomTopic.theme,
      mood: randomTopic.mood,
      genre: randomTopic.genre
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-300">
            Theme / Topic
          </label>
          <button
            type="button"
            onClick={handleSurpriseMe}
            className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1"
          >
            🎲 Surprise Me
          </button>
        </div>
        <input
          type="text"
          value={config.theme}
          onChange={(e) => updateField('theme', e.target.value)}
          placeholder="e.g., lost love, summer nights, chasing dreams..."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Mood
          </label>
          <div className="relative">
            <input
              type="text"
              list="mood-options"
              value={config.mood}
              onChange={(e) => updateField('mood', e.target.value)}
              placeholder="Type custom mood or click dropdown..."
              className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <datalist id="mood-options">
            {MOODS.map((mood) => (
              <option key={mood} value={mood.toLowerCase()} />
            ))}
          </datalist>
          <p className="text-xs text-gray-500 mt-1">💡 Type any mood or pick from dropdown</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Genre
          </label>
          <select
            value={config.genre}
            onChange={(e) => updateField('genre', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Select genre...</option>
            {GENRES.map((genre) => (
              <option key={genre} value={genre.toLowerCase()}>{genre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Syllables per line
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={config.syllablesPerLine ?? ''}
            onChange={(e) => updateField('syllablesPerLine', e.target.value ? Number(e.target.value) : null)}
            placeholder="e.g., 8"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty for no constraint</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Words per line
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={config.wordsPerLine ?? ''}
            onChange={(e) => updateField('wordsPerLine', e.target.value ? Number(e.target.value) : null)}
            placeholder="e.g., 6"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty for no constraint</p>
        </div>
      </div>
    </div>
  );
}
