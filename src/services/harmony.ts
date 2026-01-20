import type { Chord } from '../types';
import { PROGRESSIONS, getScaleNotes, NOTES } from '../utils/musicTheory';

interface GenerateHarmonyParams {
  key: string;
  scale: string;
  progressionName: string;
  bars: number;
}

// Map scale degrees to chord types based on scale
const MAJOR_SCALE_CHORD_TYPES = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim'];
const MINOR_SCALE_CHORD_TYPES = ['minor', 'dim', 'major', 'minor', 'minor', 'major', 'major'];

export function generateHarmony(params: GenerateHarmonyParams): Chord[] {
  const { key, scale, progressionName, bars } = params;
  const progression = PROGRESSIONS[progressionName];

  if (!progression) {
    return [];
  }

  const scaleNotes = getScaleNotes(key, scale);
  const chordTypes = scale.includes('minor') ? MINOR_SCALE_CHORD_TYPES : MAJOR_SCALE_CHORD_TYPES;

  // Generate chords to fill the requested bars
  const chords: Chord[] = [];
  const chordsNeeded = bars;
  const progressionLength = progression.length;

  for (let i = 0; i < chordsNeeded; i++) {
    const degree = progression[i % progressionLength];
    const root = scaleNotes[degree];
    const type = chordTypes[degree];

    chords.push({
      root,
      type,
      duration: '1n', // One bar per chord
      startTime: `${i}:0:0`,
    });
  }

  return chords;
}

export function getChordsFromProgression(
  key: string,
  scale: string,
  progressionName: string
): { root: string; type: string; numeral: string }[] {
  const progression = PROGRESSIONS[progressionName];
  if (!progression) return [];

  const scaleNotes = getScaleNotes(key, scale);
  const chordTypes = scale.includes('minor') ? MINOR_SCALE_CHORD_TYPES : MAJOR_SCALE_CHORD_TYPES;
  const numerals = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

  return progression.map((degree) => ({
    root: scaleNotes[degree],
    type: chordTypes[degree],
    numeral: numerals[degree],
  }));
}

export function suggestChordSubstitution(chord: Chord): Chord[] {
  // Common chord substitutions
  const substitutions: Chord[] = [];

  // Relative minor/major
  const rootIndex = NOTES.indexOf(chord.root);

  if (chord.type === 'major') {
    // Relative minor (down 3 semitones)
    const relMinorRoot = NOTES[(rootIndex + 9) % 12];
    substitutions.push({ ...chord, root: relMinorRoot, type: 'minor' });

    // Add 7th
    substitutions.push({ ...chord, type: 'maj7' });

    // Sus4
    substitutions.push({ ...chord, type: 'sus4' });
  } else if (chord.type === 'minor') {
    // Relative major (up 3 semitones)
    const relMajorRoot = NOTES[(rootIndex + 3) % 12];
    substitutions.push({ ...chord, root: relMajorRoot, type: 'major' });

    // Add 7th
    substitutions.push({ ...chord, type: 'min7' });
  }

  // Tritone substitution for dominant 7th
  if (chord.type === '7') {
    const tritoneRoot = NOTES[(rootIndex + 6) % 12];
    substitutions.push({ ...chord, root: tritoneRoot, type: '7' });
  }

  return substitutions;
}

export function getChordNotes(root: string, type: string, octave: number = 3): string[] {
  const rootIndex = NOTES.indexOf(root);

  const intervals: Record<string, number[]> = {
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

  const chordIntervals = intervals[type] || intervals.major;

  return chordIntervals.map((interval) => {
    const noteIndex = (rootIndex + interval) % 12;
    const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
    return `${NOTES[noteIndex]}${noteOctave}`;
  });
}
