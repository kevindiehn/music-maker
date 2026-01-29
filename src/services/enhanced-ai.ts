// Lazy load Magenta only when needed to reduce bundle size
// import * as mm from '@magenta/music';  
import type { SongSection, Note } from '../types';
import { generateLyrics } from './ai';  // Keep the original as fallback

// Placeholder interface until we fully integrate Magenta
interface INoteSequence {
  notes?: Array<{
    pitch: number;
    startTime: number;
    endTime: number;
    velocity: number;
  }>;
  tempos?: Array<{ time: number; qpm: number }>;
  totalTime?: number;
}

// Helper function to convert pitch notation to MIDI numbers
function convertPitchToMidi(pitch: string): number {
  const noteMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
    'A#': 10, 'Bb': 10, 'B': 11
  };
  
  const noteName = pitch.slice(0, -1);
  const octave = parseInt(pitch.slice(-1));
  
  return (octave + 1) * 12 + (noteMap[noteName] || 0);
}

interface EnhancedGenerateLyricsParams {
  theme: string;
  mood: string;
  genre: string;
  rhymeScheme: string;
  syllablesPerLine: number | null;
  wordsPerLine: number | null;
  sections: SongSection[];
  melody?: Note[];  // Add melody context
  key?: string;
  scale?: string;
  tempo?: number;
}

// Convert our note format to Magenta's NoteSequence format
function convertToNoteSequence(notes: Note[], tempo: number = 120): INoteSequence {
  const noteSequence: INoteSequence = {
    notes: [],
    tempos: [{ time: 0, qpm: tempo }],
    totalTime: 0,
  };

  let maxTime = 0;
  
  notes.forEach(note => {
    const [bar, beat, sixteenth] = note.startTime.split(':').map(Number);
    const startTime = (bar * 4 + beat + sixteenth / 4) * (60 / tempo);
    
    // Convert duration to seconds
    const durationMap: Record<string, number> = {
      '1n': 240 / tempo,   // whole note
      '2n': 120 / tempo,   // half note  
      '4n': 60 / tempo,    // quarter note
      '8n': 30 / tempo,    // eighth note
      '16n': 15 / tempo,   // sixteenth note
    };
    
    const duration = durationMap[note.duration] || 60 / tempo;
    const endTime = startTime + duration;
    
    // Convert pitch (C4 -> MIDI number) - using basic conversion for now
    const pitchNumber = convertPitchToMidi(note.pitch);
    
    noteSequence.notes?.push({
      pitch: pitchNumber,
      startTime,
      endTime,
      velocity: 80,
    });
    
    maxTime = Math.max(maxTime, endTime);
  });
  
  noteSequence.totalTime = maxTime;
  return noteSequence;
}

// Analyze melody to inform lyrics generation
function analyzeMelody(notes: Note[]): {
  contour: string;
  rhythmPattern: string;
  musicalMood: string;
  phraseLengths: number[];
} {
  if (notes.length === 0) {
    return {
      contour: 'neutral',
      rhythmPattern: 'regular',
      musicalMood: 'moderate',
      phraseLengths: [4],
    };
  }

  // Analyze pitch contour
  const pitches = notes.map(n => convertPitchToMidi(n.pitch));
  let ascending = 0, descending = 0;
  
  for (let i = 1; i < pitches.length; i++) {
    if (pitches[i] > pitches[i-1]) ascending++;
    else if (pitches[i] < pitches[i-1]) descending++;
  }
  
  const contour = ascending > descending ? 'ascending' : 
                 descending > ascending ? 'descending' : 'stable';

  // Analyze rhythm patterns
  const durations = notes.map(n => n.duration);
  const hasVariety = new Set(durations).size > 2;
  const rhythmPattern = hasVariety ? 'syncopated' : 'regular';

  // Determine musical mood based on intervals and rhythm
  const range = Math.max(...pitches) - Math.min(...pitches);
  const musicalMood = range > 12 ? 'dramatic' : 
                     rhythmPattern === 'syncopated' ? 'energetic' : 'gentle';

  // Calculate phrase lengths (rough estimate based on note groupings)
  const phraseLengths = [4, 4]; // Simplified for now

  return { contour, rhythmPattern, musicalMood, phraseLengths };
}

export async function generateEnhancedLyrics(params: EnhancedGenerateLyricsParams): Promise<SongSection[]> {
  try {
    // If no melody provided, fall back to original AI
    if (!params.melody || params.melody.length === 0) {
      return await generateLyrics(params);
    }

    // Analyze the melody to inform lyrics
    const melodyAnalysis = analyzeMelody(params.melody);
    
    // Enhanced parameters with musical context + anti-repetition
    const enhancedParams = {
      ...params,
      // Modify mood based on musical analysis
      mood: `${params.mood} with ${melodyAnalysis.musicalMood} musical energy (NO generic "walking through" patterns!)`,
      // Add musical context to theme
      theme: `${params.theme} (expressed through ${melodyAnalysis.contour} melodies) - use specific imagery not clichés`,
      // Add anti-repetition emphasis for music-aware generation
      sections: params.sections.map((section, index) => ({
        ...section,
        id: section.id + '_music_aware_' + index  // Ensure unique IDs
      }))
    };

    console.log('🎵 Generating music-aware lyrics with context:', melodyAnalysis);
    
    // Use original AI service with enhanced prompting for now
    // TODO: In the future, could integrate Magenta's MusicVAE for melody-conditioned text
    const result = await generateLyrics(enhancedParams);
    
    // Post-process to better match note count
    return result.map(section => ({
      ...section,
      lines: section.lines.map(line => {
        // Simple syllable matching - could be enhanced with Magenta's rhythm models
        const targetSyllables = params.melody ? Math.ceil(params.melody.length / section.lines.length) : 8;
        return adjustLineToSyllableCount(line, targetSyllables);
      })
    }));

  } catch (error) {
    console.error('Enhanced AI lyrics generation failed:', error);
    // Fallback to original AI
    return await generateLyrics(params);
  }
}

// Helper function to adjust line syllable count
function adjustLineToSyllableCount(line: string, targetSyllables: number): string {
  // This is a simplified version - in practice, you'd want more sophisticated
  // syllable counting and word substitution
  const words = line.split(' ');
  const currentSyllables = countSyllables(line);
  
  if (currentSyllables === targetSyllables) {
    return line;
  }
  
  if (currentSyllables < targetSyllables) {
    // Add descriptive words
    const descriptors = ['beautiful', 'gentle', 'shining', 'golden', 'dancing'];
    const randomDescriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
    words.splice(Math.floor(words.length / 2), 0, randomDescriptor);
  } else if (words.length > 2) {
    // Remove a word if too many syllables
    words.splice(Math.floor(words.length / 2), 1);
  }
  
  return words.join(' ');
}

// Simple syllable counting (could use the 'syllable' package for accuracy)
function countSyllables(text: string): number {
  return text.split(' ').reduce((count, word) => {
    // Very basic syllable estimation
    const vowelGroups = word.toLowerCase().match(/[aeiouy]+/g);
    return count + (vowelGroups ? vowelGroups.length : 1);
  }, 0);
}

// Future: Generate melody-aware variations using Magenta
export async function generateMelodyVariations(notes: Note[]): Promise<Note[][]> {
  try {
    if (notes.length === 0) return [];

    // Convert to Magenta format
    const noteSequence = convertToNoteSequence(notes);
    
    // For now, return the original - future: use MusicVAE for variations
    console.log('🎼 Melody analysis ready for Magenta integration:', noteSequence);
    
    return [notes]; // Placeholder
  } catch (error) {
    console.error('Melody variation generation failed:', error);
    return [notes];
  }
}

// Future: Analyze harmony for chord-aware lyrics
export function analyzeMelodyForHarmony(_notes: Note[], _key: string = 'C'): string[] {
  // Future: Use Magenta's chord analysis
  // For now, return basic chord suggestions
  return ['I', 'vi', 'IV', 'V'];
}