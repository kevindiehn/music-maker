import type { Note, MelodyConfig } from '../types';
import { getScaleNotes } from '../utils/musicTheory';

interface GenerateMelodyParams {
  config: MelodyConfig;
  bars: number;
  syllablePattern?: number[]; // syllables per line to match rhythm
}

type ContourType = 'ascending' | 'descending' | 'arch' | 'wave' | 'random';

export function generateMelody(params: GenerateMelodyParams): Note[] {
  const { config, bars, syllablePattern } = params;
  const scaleNotes = getScaleNotes(config.key, config.scale);
  const notes: Note[] = [];

  const beatsPerBar = config.timeSignature[0];
  const totalBeats = bars * beatsPerBar;

  // Generate rhythm pattern based on syllables or default
  const rhythmPattern = syllablePattern
    ? generateRhythmFromSyllables(syllablePattern, totalBeats)
    : generateDefaultRhythm(totalBeats);

  // Choose a contour for the melody
  const contour = chooseContour();

  // Generate notes following the rhythm and contour
  let currentPosition = 0;
  rhythmPattern.forEach((duration, index) => {
    const pitch = selectPitch(scaleNotes, index, rhythmPattern.length, contour);
    notes.push({
      pitch,
      duration: durationToToneNotation(duration),
      startTime: positionToTime(currentPosition),
    });
    currentPosition += duration;
  });

  return notes;
}

function generateRhythmFromSyllables(syllables: number[], totalBeats: number): number[] {
  const totalSyllables = syllables.reduce((a, b) => a + b, 0);
  const beatValue = (totalBeats * 4) / totalSyllables; // in 16th notes

  const rhythm: number[] = [];
  syllables.forEach((count) => {
    for (let i = 0; i < count; i++) {
      rhythm.push(Math.max(1, Math.round(beatValue)));
    }
  });

  return rhythm;
}

function generateDefaultRhythm(totalBeats: number): number[] {
  const rhythm: number[] = [];
  let remaining = totalBeats * 4; // Convert to 16th notes

  while (remaining > 0) {
    // Randomly choose note duration (1=16th, 2=8th, 4=quarter, 8=half)
    const possibleDurations = [1, 2, 4].filter((d) => d <= remaining);
    const duration = possibleDurations[Math.floor(Math.random() * possibleDurations.length)];
    rhythm.push(duration);
    remaining -= duration;
  }

  return rhythm;
}

function chooseContour(): ContourType {
  const contours: ContourType[] = ['ascending', 'descending', 'arch', 'wave', 'random'];
  return contours[Math.floor(Math.random() * contours.length)];
}

function selectPitch(
  scaleNotes: string[],
  noteIndex: number,
  totalNotes: number,
  contour: ContourType
): string {
  const octaves = [3, 4, 5];
  const progress = noteIndex / totalNotes;

  let scaleIndex: number;

  switch (contour) {
    case 'ascending':
      scaleIndex = Math.floor(progress * (scaleNotes.length - 1));
      break;
    case 'descending':
      scaleIndex = Math.floor((1 - progress) * (scaleNotes.length - 1));
      break;
    case 'arch':
      // Go up then down
      scaleIndex = progress < 0.5
        ? Math.floor(progress * 2 * (scaleNotes.length - 1))
        : Math.floor((1 - progress) * 2 * (scaleNotes.length - 1));
      break;
    case 'wave':
      // Sine wave pattern
      scaleIndex = Math.floor(
        ((Math.sin(progress * Math.PI * 4) + 1) / 2) * (scaleNotes.length - 1)
      );
      break;
    case 'random':
    default:
      // Favor stepwise motion with occasional leaps
      if (noteIndex === 0) {
        scaleIndex = Math.floor(scaleNotes.length / 2);
      } else {
        const prevIndex = Math.floor(Math.random() * scaleNotes.length);
        const step = Math.random() < 0.7
          ? (Math.random() < 0.5 ? -1 : 1) // stepwise
          : Math.floor(Math.random() * 3) - 1; // leap
        scaleIndex = Math.max(0, Math.min(scaleNotes.length - 1, prevIndex + step));
      }
  }

  const note = scaleNotes[scaleIndex];
  const octave = octaves[1]; // Default to octave 4

  // Adjust octave based on position for variety
  const octaveAdjust = progress < 0.3 ? 0 : progress > 0.7 ? 0 : 0;

  return `${note}${octave + octaveAdjust}`;
}

function durationToToneNotation(sixteenths: number): string {
  switch (sixteenths) {
    case 1: return '16n';
    case 2: return '8n';
    case 4: return '4n';
    case 8: return '2n';
    case 16: return '1n';
    default: return '8n';
  }
}

function positionToTime(sixteenths: number): string {
  const bars = Math.floor(sixteenths / 16);
  const beats = Math.floor((sixteenths % 16) / 4);
  const sixteenthsRemainder = sixteenths % 4;
  return `${bars}:${beats}:${sixteenthsRemainder}`;
}

export function clearMelody(): Note[] {
  return [];
}
