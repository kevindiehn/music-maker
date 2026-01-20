// Lyrics types
export interface LyricsConfig {
  theme: string;
  mood: string;
  genre: string;
  syllablesPerLine: number | null;
  wordsPerLine: number | null;
  rhymeScheme: 'ABAB' | 'AABB' | 'ABBA' | 'free' | string;
  structure: SongSection[];
}

export interface SongSection {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'outro' | 'intro';
  lines: string[];
}

export interface Song {
  id: string;
  title: string;
  lyrics: LyricsConfig;
  sections: SongSection[];
}

// Melody types
export interface MelodyConfig {
  key: string;
  scale: string;
  tempo: number;
  timeSignature: [number, number];
}

export interface Note {
  pitch: string;
  duration: string;
  startTime: string;
}

export interface Melody {
  config: MelodyConfig;
  notes: Note[];
}

// Harmony types
export interface Chord {
  root: string;
  type: string;
  duration: string;
  startTime: string;
}

export interface Harmony {
  chords: Chord[];
  progressionName?: string;
}

// Instrument types
export interface Instrument {
  id: string;
  name: string;
  type: 'melody' | 'chords' | 'bass' | 'drums';
  volume: number;
  muted: boolean;
  solo: boolean;
}

export interface Track {
  instrumentId: string;
  notes: Note[];
}

export interface Arrangement {
  instruments: Instrument[];
  tracks: Track[];
}

// App state
export interface AppState {
  song: Song | null;
  melody: Melody | null;
  harmony: Harmony | null;
  arrangement: Arrangement | null;
}
