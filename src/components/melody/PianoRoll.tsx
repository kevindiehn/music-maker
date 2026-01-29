import { useState } from 'react';
import type { Note, SongSection } from '../../types';
import { extractAllWords } from '../../services/syllables';

interface PianoRollProps {
  notes: Note[];
  onChange: (notes: Note[]) => void;
  bars?: number;
  lyrics?: SongSection[];
}

const DURATIONS = [
  { value: '16n', label: '16th', color: 'bg-red-500' },
  { value: '8n', label: '8th', color: 'bg-orange-500' },
  { value: '4n', label: '1/4', color: 'bg-blue-500' },
  { value: '2n', label: '1/2', color: 'bg-green-500' },
];

const PIANO_NOTES = [
  'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4',
  'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'
];

const isBlackKey = (note: string) => note.includes('#');

export function PianoRoll({ notes, onChange, bars = 4, lyrics = [] }: PianoRollProps) {
  const [selectedDuration, setSelectedDuration] = useState('8n');
  
  const beatsPerBar = 4;
  const totalBeats = bars * beatsPerBar;
  const subdivisions = 4; // 16th notes
  const totalCells = totalBeats * subdivisions;

  // Extract all words from lyrics and sort notes by time for mapping
  const allWords = lyrics.flatMap((section) => extractAllWords(section.lines));
  const sortedNotes = [...notes].sort((a, b) => {
    const parseTime = (t: string) => {
      const [bar, beat, sixteenth] = t.split(':').map(Number);
      return bar * 16 + beat * 4 + sixteenth;
    };
    return parseTime(a.startTime) - parseTime(b.startTime);
  });

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
        duration: selectedDuration as Note['duration'],
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
      {/* Duration Selector */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-gray-400">Note Duration:</span>
        {DURATIONS.map((duration) => (
          <button
            key={duration.value}
            onClick={() => setSelectedDuration(duration.value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedDuration === duration.value
                ? `${duration.color} text-white`
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {duration.label}
          </button>
        ))}
      </div>

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
              
              // Find the note at this position to get its duration/color
              const startTime = `0:${Math.floor(cellIndex / subdivisions)}:${(cellIndex % subdivisions) * (subdivisions / 4)}`;
              const noteAtPosition = notes.find(n => n.pitch === pitch && n.startTime === startTime);
              const noteDuration = noteAtPosition ? DURATIONS.find(d => d.value === noteAtPosition.duration) : null;

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
                      ? `${noteDuration?.color || 'bg-indigo-500'} hover:opacity-80`
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

      {/* Lyrics display - readable word chips */}
      {allWords.length > 0 && (
        <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-indigo-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-indigo-400">Lyrics → Notes</span>
            <span className="text-xs text-gray-500">
              {allWords.length} words • {notes.length} notes
              {allWords.length !== notes.length && (
                <span className="text-yellow-500 ml-1">
                  ({allWords.length > notes.length ? `+${allWords.length - notes.length} words` : `+${notes.length - allWords.length} notes`})
                </span>
              )}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {sortedNotes.map((note, index) => {
              const word = allWords[index];
              return (
                <div
                  key={`${note.startTime}-${note.pitch}`}
                  className={`px-2 py-1 rounded text-xs ${
                    word
                      ? 'bg-indigo-600/40 text-indigo-200 border border-indigo-500/50'
                      : 'bg-gray-700/50 text-gray-500 border border-gray-600/50'
                  }`}
                  title={`${note.pitch} at ${note.startTime}`}
                >
                  {word || '♪'}
                </div>
              );
            })}
            {/* Show remaining words that don't have notes */}
            {allWords.slice(notes.length).map((word, index) => (
              <div
                key={`extra-${index}`}
                className="px-2 py-1 rounded text-xs bg-yellow-600/30 text-yellow-300 border border-yellow-500/50"
                title="No note assigned"
              >
                {word}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
