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

  // Calculate target note count based on lyrics if provided
  const targetNoteCount = syllablePattern 
    ? Math.max(syllablePattern.reduce((a, b) => a + b, 0), totalBeats * 2) // At least 2 notes per beat
    : totalBeats * 2; // Default to 2 notes per beat

  // Generate rhythm pattern - more controlled approach
  const rhythmPattern = generateControlledRhythm(totalBeats, targetNoteCount);

  // Choose a contour for the melody
  const contour = chooseContour();

  // Generate notes following the rhythm and contour
  let currentPosition = 0;
  let prevScaleIndex = Math.floor(scaleNotes.length / 2); // Start in middle of scale

  rhythmPattern.forEach((duration, index) => {
    const { pitch, scaleIndex } = selectPitch(scaleNotes, index, rhythmPattern.length, contour, prevScaleIndex);
    prevScaleIndex = scaleIndex;
    
    const note: Note = {
      pitch,
      duration: durationToToneNotation(duration),
      startTime: positionToTime(currentPosition),
    };
    
    notes.push(note);
    currentPosition += duration;
  });

  return notes;
}

// Note: Keeping this for potential future use with complex syllable patterns
// function generateRhythmFromSyllables(syllables: number[], totalBeats: number): number[] {
//   const totalSyllables = syllables.reduce((a, b) => a + b, 0);
//   const beatValue = (totalBeats * 4) / totalSyllables; // in 16th notes

//   const rhythm: number[] = [];
//   syllables.forEach((count) => {
//     for (let i = 0; i < count; i++) {
//       rhythm.push(Math.max(1, Math.round(beatValue)));
//     }
//   });

//   return rhythm;
// }

function generateControlledRhythm(totalBeats: number, targetNoteCount: number): number[] {
  const rhythm: number[] = [];
  const totalSixteenths = totalBeats * 4;
  
  // More predictable approach: create note count close to target
  
  let remaining = totalSixteenths;
  let notesGenerated = 0;
  
  while (remaining > 0 && notesGenerated < targetNoteCount * 1.5) { // Safety limit
    const notesLeft = targetNoteCount - notesGenerated;
    
    if (notesLeft <= 1) {
      // Last note - use all remaining
      rhythm.push(remaining);
      break;
    }
    
    // Calculate ideal duration for remaining notes
    const idealDuration = remaining / notesLeft;
    
    // Choose duration close to ideal but with some variation
    let duration: number;
    if (idealDuration >= 6) {
      duration = 4; // Quarter note
    } else if (idealDuration >= 3) {
      duration = Math.random() < 0.6 ? 4 : 2; // Mostly quarters, some eighths
    } else if (idealDuration >= 1.5) {
      duration = 2; // Eighth note
    } else {
      duration = 1; // Sixteenth note
    }
    
    // Ensure we don't exceed remaining
    duration = Math.min(duration, remaining);
    duration = Math.max(1, duration); // At least a sixteenth
    
    rhythm.push(duration);
    remaining -= duration;
    notesGenerated++;
  }
  
  return rhythm;
}

// Keep the old function for syllable-based generation (currently unused)
// function generateDefaultRhythm(totalBeats: number): number[] {
//   return generateControlledRhythm(totalBeats, totalBeats * 2);
// }

function chooseContour(): ContourType {
  const contours: ContourType[] = ['ascending', 'descending', 'arch', 'wave', 'random'];
  return contours[Math.floor(Math.random() * contours.length)];
}

function selectPitch(
  scaleNotes: string[],
  noteIndex: number,
  totalNotes: number,
  contour: ContourType,
  prevScaleIndex: number
): { pitch: string; scaleIndex: number } {
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
    default: {
      // Favor stepwise motion with occasional leaps, using actual previous index
      const step = Math.random() < 0.7
        ? (Math.random() < 0.5 ? -1 : 1) // stepwise (70%)
        : (Math.random() < 0.5 ? -2 : 2); // small leap (30%)
      scaleIndex = Math.max(0, Math.min(scaleNotes.length - 1, prevScaleIndex + step));
      break;
    }
  }

  const note = scaleNotes[scaleIndex];

  // Vary octave based on scale position for more range
  let octave = 4;
  if (scaleIndex < 2) octave = 3;
  else if (scaleIndex > scaleNotes.length - 3) octave = 5;

  return { pitch: `${note}${octave}`, scaleIndex };
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

// Generate melody specifically sized to match lyrics
export function generateMelodyForLyrics(
  config: MelodyConfig, 
  lyrics: string[],
  bars: number = 4
): Note[] {
  // Count total words/syllables in lyrics
  const totalWords = lyrics.join(' ').split(/\s+/).filter(w => w.length > 0).length;
  
  // Estimate syllables (rough approximation)
  const estimatedSyllables = totalWords * 1.3; // Average ~1.3 syllables per word
  
  return generateMelody({
    config,
    bars: Math.max(bars, Math.ceil(totalWords / 8)), // At least 1 bar per 8 words
    syllablePattern: [Math.ceil(estimatedSyllables)]
  });
}

export function clearMelody(): Note[] {
  return [];
}
