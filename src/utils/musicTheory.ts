// Musical scales
export const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

// Note names
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Chord types with intervals
export const CHORD_TYPES: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
};

// Common chord progressions (as scale degrees, 0-indexed)
export const PROGRESSIONS: Record<string, number[]> = {
  'I-IV-V-I': [0, 3, 4, 0],
  'I-V-vi-IV': [0, 4, 5, 3],
  'ii-V-I': [1, 4, 0],
  'I-vi-IV-V': [0, 5, 3, 4],
  'vi-IV-I-V': [5, 3, 0, 4],
  'I-IV-vi-V': [0, 3, 5, 4],
};

export function getNoteIndex(note: string): number {
  const baseNote = note.replace(/\d/g, '');
  return NOTES.indexOf(baseNote);
}

export function getNoteName(index: number): string {
  return NOTES[((index % 12) + 12) % 12];
}

export function getScaleNotes(root: string, scale: string): string[] {
  const rootIndex = getNoteIndex(root);
  const intervals = SCALES[scale] || SCALES.major;
  return intervals.map((interval) => getNoteName(rootIndex + interval));
}

export function getChordNotes(root: string, chordType: string): string[] {
  const rootIndex = getNoteIndex(root);
  const intervals = CHORD_TYPES[chordType] || CHORD_TYPES.major;
  return intervals.map((interval) => getNoteName(rootIndex + interval));
}
