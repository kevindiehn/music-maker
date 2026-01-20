interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  tempo: number;
  onTempoChange?: (tempo: number) => void;
  disabled?: boolean;
}

export function PlaybackControls({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  tempo,
  onTempoChange,
  disabled = false,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {isPlaying ? (
          <button
            onClick={onPause}
            disabled={disabled}
            className="p-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full transition-colors"
            title="Pause"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={disabled}
            className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full transition-colors"
            title="Play"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </button>
        )}

        <button
          onClick={onStop}
          disabled={disabled}
          className="p-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full transition-colors"
          title="Stop"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" />
          </svg>
        </button>
      </div>

      {onTempoChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Tempo:</span>
          <input
            type="range"
            min={60}
            max={180}
            value={tempo}
            onChange={(e) => onTempoChange(Number(e.target.value))}
            className="w-24"
            disabled={disabled}
          />
          <span className="text-sm text-white w-12">{tempo} BPM</span>
        </div>
      )}
    </div>
  );
}
