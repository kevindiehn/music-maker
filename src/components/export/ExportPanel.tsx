import { useRef, useState } from 'react';
import type { Note, Chord, SongSection, MelodyConfig, Instrument } from '../../types';
import {
  exportToMidi,
  exportProject,
  parseProject,
  downloadBlob,
  generateFilename,
  type ProjectData,
} from '../../services/export';

interface ExportPanelProps {
  projectTitle: string;
  onProjectTitleChange: (title: string) => void;
  lyrics: {
    theme: string;
    mood: string;
    genre: string;
    syllablesPerLine: number | null;
    wordsPerLine: number | null;
    rhymeScheme: string;
    sections: SongSection[];
  };
  melody: {
    config: MelodyConfig;
    notes: Note[];
    bars: number;
  };
  harmony: {
    chords: Chord[];
    progressionName: string | null;
  };
  instruments: Instrument[];
  onLoadProject: (data: ProjectData) => void;
}

export function ExportPanel({
  projectTitle,
  onProjectTitleChange,
  lyrics,
  melody,
  harmony,
  instruments,
  onLoadProject,
}: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportMidi = () => {
    setIsExporting(true);
    try {
      const blob = exportToMidi({
        notes: melody.notes,
        chords: harmony.chords,
        tempo: melody.config.tempo,
        title: projectTitle,
      });
      downloadBlob(blob, generateFilename(projectTitle, 'mid'));
    } catch (error) {
      console.error('Failed to export MIDI:', error);
      alert('Failed to export MIDI file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportProject = () => {
    setIsExporting(true);
    try {
      const blob = exportProject({
        title: projectTitle,
        lyrics,
        melody,
        harmony,
        instruments,
      });
      downloadBlob(blob, generateFilename(projectTitle, 'json'));
    } catch (error) {
      console.error('Failed to export project:', error);
      alert('Failed to export project file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const data = parseProject(content);

      if (data) {
        onLoadProject(data);
      } else {
        setLoadError('Invalid project file. Please select a valid Music Maker project.');
      }
    };
    reader.onerror = () => {
      setLoadError('Failed to read file. Please try again.');
    };
    reader.readAsText(file);

    // Reset input so the same file can be loaded again
    event.target.value = '';
  };

  const hasMelody = melody.notes.length > 0;
  const hasChords = harmony.chords.length > 0;
  const hasContent = hasMelody || hasChords || lyrics.sections.length > 0;

  return (
    <div className="space-y-6">
      {/* Project Title */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Project Details</h2>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Project Title
          </label>
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => onProjectTitleChange(e.target.value)}
            placeholder="My Song"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Export</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MIDI Export */}
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🎹</span>
              <h3 className="font-medium">MIDI File</h3>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Export melody and chords as a MIDI file. Import into any DAW (GarageBand, FL Studio, Ableton, etc.)
            </p>
            <button
              onClick={handleExportMidi}
              disabled={isExporting || (!hasMelody && !hasChords)}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {isExporting ? 'Exporting...' : 'Download .mid'}
            </button>
            {!hasMelody && !hasChords && (
              <p className="text-xs text-gray-500 mt-2">
                Create a melody or chords first
              </p>
            )}
          </div>

          {/* Project Save */}
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">💾</span>
              <h3 className="font-medium">Project File</h3>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Save your entire project including lyrics, melody, chords, and instruments to continue later.
            </p>
            <button
              onClick={handleExportProject}
              disabled={isExporting || !hasContent}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {isExporting ? 'Saving...' : 'Download .json'}
            </button>
            {!hasContent && (
              <p className="text-xs text-gray-500 mt-2">
                Add some content first
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Load Project */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Load Project</h2>

        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📂</span>
            <h3 className="font-medium">Open Existing Project</h3>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Load a previously saved Music Maker project file (.json)
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleLoadProject}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium transition-colors"
          >
            Choose File...
          </button>

          {loadError && (
            <p className="text-xs text-red-400 mt-2">{loadError}</p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Project Summary</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-indigo-400">
              {lyrics.sections.length}
            </div>
            <div className="text-xs text-gray-400">Sections</div>
          </div>
          <div className="p-3 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-400">
              {melody.notes.length}
            </div>
            <div className="text-xs text-gray-400">Notes</div>
          </div>
          <div className="p-3 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {harmony.chords.length}
            </div>
            <div className="text-xs text-gray-400">Chords</div>
          </div>
          <div className="p-3 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">
              {instruments.length}
            </div>
            <div className="text-xs text-gray-400">Instruments</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Key:</span>{' '}
              <span className="text-white">{melody.config.key} {melody.config.scale}</span>
            </div>
            <div>
              <span className="text-gray-400">Tempo:</span>{' '}
              <span className="text-white">{melody.config.tempo} BPM</span>
            </div>
            <div>
              <span className="text-gray-400">Time Signature:</span>{' '}
              <span className="text-white">{melody.config.timeSignature[0]}/{melody.config.timeSignature[1]}</span>
            </div>
            <div>
              <span className="text-gray-400">Bars:</span>{' '}
              <span className="text-white">{melody.bars}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
