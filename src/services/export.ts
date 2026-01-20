import { Midi } from '@tonejs/midi';
import type { Note, Chord, SongSection, MelodyConfig, Instrument } from '../types';
import { getChordNotes } from './harmony';

// Convert Tone.js duration notation to ticks
function durationToTicks(duration: string, ppq: number = 480): number {
  const map: Record<string, number> = {
    '1n': ppq * 4,      // whole note
    '2n': ppq * 2,      // half note
    '4n': ppq,          // quarter note
    '8n': ppq / 2,      // eighth note
    '16n': ppq / 4,     // sixteenth note
    '32n': ppq / 8,     // thirty-second note
  };
  return map[duration] || ppq;
}

// Convert Tone.js time format to ticks
function timeToTicks(time: string, ppq: number = 480, _bpm: number = 120): number {
  // Format: "bars:beats:sixteenths" e.g., "0:0:0", "1:2:0"
  const [bars, beats, sixteenths] = time.split(':').map(Number);
  const ticksPerBar = ppq * 4; // Assuming 4/4 time
  const ticksPerBeat = ppq;
  const ticksPerSixteenth = ppq / 4;

  return (bars * ticksPerBar) + (beats * ticksPerBeat) + (sixteenths * ticksPerSixteenth);
}

// Convert note name to MIDI number
function noteToMidi(note: string): number {
  const noteMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };

  const match = note.match(/([A-G]#?)(\d+)/);
  if (!match) return 60; // Default to middle C

  const [, noteName, octaveStr] = match;
  const octave = parseInt(octaveStr);

  return noteMap[noteName] + (octave + 1) * 12;
}

export interface ExportMidiOptions {
  notes: Note[];
  chords: Chord[];
  tempo: number;
  title?: string;
}

export function exportToMidi(options: ExportMidiOptions): Blob {
  const { notes, chords, tempo, title = 'Music Maker Export' } = options;

  const midi = new Midi();
  midi.header.setTempo(tempo);
  midi.header.name = title;

  const ppq = midi.header.ppq;

  // Add melody track
  if (notes.length > 0) {
    const melodyTrack = midi.addTrack();
    melodyTrack.name = 'Melody';
    melodyTrack.channel = 0;

    notes.forEach((note) => {
      const ticks = timeToTicks(note.startTime, ppq, tempo);
      const durationTicks = durationToTicks(note.duration, ppq);

      melodyTrack.addNote({
        midi: noteToMidi(note.pitch),
        time: ticks / ppq / (tempo / 60),
        duration: durationTicks / ppq / (tempo / 60),
        velocity: 0.8,
      });
    });
  }

  // Add chords track
  if (chords.length > 0) {
    const chordsTrack = midi.addTrack();
    chordsTrack.name = 'Chords';
    chordsTrack.channel = 1;

    chords.forEach((chord) => {
      const chordNotes = getChordNotes(chord.root, chord.type, 3);
      const ticks = timeToTicks(chord.startTime, ppq, tempo);
      const durationTicks = durationToTicks(chord.duration, ppq);

      chordNotes.forEach((noteName) => {
        chordsTrack.addNote({
          midi: noteToMidi(noteName),
          time: ticks / ppq / (tempo / 60),
          duration: durationTicks / ppq / (tempo / 60),
          velocity: 0.6,
        });
      });
    });
  }

  // Add bass track (root notes of chords)
  if (chords.length > 0) {
    const bassTrack = midi.addTrack();
    bassTrack.name = 'Bass';
    bassTrack.channel = 2;

    chords.forEach((chord) => {
      const ticks = timeToTicks(chord.startTime, ppq, tempo);
      const durationTicks = durationToTicks(chord.duration, ppq);

      bassTrack.addNote({
        midi: noteToMidi(`${chord.root}2`),
        time: ticks / ppq / (tempo / 60),
        duration: durationTicks / ppq / (tempo / 60),
        velocity: 0.7,
      });
    });
  }

  const midiArray = midi.toArray();
  return new Blob([new Uint8Array(midiArray)], { type: 'audio/midi' });
}

export interface ProjectData {
  version: string;
  title: string;
  createdAt: string;
  updatedAt: string;
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
}

export function exportProject(data: Omit<ProjectData, 'version' | 'createdAt' | 'updatedAt'>): Blob {
  const projectData: ProjectData = {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  };

  const json = JSON.stringify(projectData, null, 2);
  return new Blob([json], { type: 'application/json' });
}

export function parseProject(json: string): ProjectData | null {
  try {
    const data = JSON.parse(json) as ProjectData;

    // Validate required fields
    if (!data.version || !data.lyrics || !data.melody || !data.harmony) {
      console.error('Invalid project file: missing required fields');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to parse project file:', error);
    return null;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateFilename(title: string, extension: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'music-maker-export';

  const timestamp = new Date().toISOString().slice(0, 10);
  return `${sanitized}-${timestamp}.${extension}`;
}
