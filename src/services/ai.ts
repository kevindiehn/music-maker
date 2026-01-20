import type { SongSection } from '../types';

interface GenerateLyricsParams {
  theme: string;
  mood: string;
  genre: string;
  rhymeScheme: string;
  syllablesPerLine: number | null;
  wordsPerLine: number | null;
  sections: SongSection[];
}

interface GenerateSectionParams {
  theme: string;
  mood: string;
  genre: string;
  rhymeScheme: string;
  syllablesPerLine: number | null;
  wordsPerLine: number | null;
  sectionType: SongSection['type'];
}

// This will be replaced with actual API calls
// For now, returns placeholder text to demonstrate the UI
export async function generateLyrics(params: GenerateLyricsParams): Promise<SongSection[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return params.sections.map((section) => ({
    ...section,
    lines: generatePlaceholderLyrics(section.type, params),
  }));
}

export async function generateSectionLyrics(params: GenerateSectionParams): Promise<string[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return generatePlaceholderLyrics(params.sectionType, params);
}

function generatePlaceholderLyrics(
  sectionType: SongSection['type'],
  params: { theme: string; mood: string; syllablesPerLine: number | null }
): string[] {
  const lineCount = sectionType === 'chorus' ? 4 : sectionType === 'bridge' ? 2 : sectionType === 'intro' || sectionType === 'outro' ? 2 : 4;

  const placeholders: Record<string, string[]> = {
    intro: [
      `Here begins a tale of ${params.theme || 'dreams'}`,
      `A ${params.mood || 'quiet'} melody unfolds`,
    ],
    verse: [
      `Walking through the ${params.theme || 'night'} alone`,
      `Feeling ${params.mood || 'lost'} without a home`,
      `Searching for a sign to guide my way`,
      `Hoping that tomorrow brings a brighter day`,
    ],
    chorus: [
      `${params.theme || 'Dreams'} are calling out to me`,
      `${params.mood || 'Free'} is all I want to be`,
      `Rise up high and touch the sky`,
      `Never gonna say goodbye`,
    ],
    bridge: [
      `But then I realize what matters most`,
      `Is finding peace from coast to coast`,
    ],
    outro: [
      `And so the story ends tonight`,
      `Fading gently into light`,
    ],
  };

  return placeholders[sectionType]?.slice(0, lineCount) || [`[${sectionType} lyrics]`];
}

// Build the prompt for the AI
export function buildLyricsPrompt(params: GenerateLyricsParams): string {
  let prompt = `Write song lyrics with the following specifications:\n\n`;
  prompt += `Theme: ${params.theme || 'any'}\n`;
  prompt += `Mood: ${params.mood || 'any'}\n`;
  prompt += `Genre: ${params.genre || 'any'}\n`;
  prompt += `Rhyme Scheme: ${params.rhymeScheme || 'free verse'}\n`;

  if (params.syllablesPerLine) {
    prompt += `Target syllables per line: ${params.syllablesPerLine}\n`;
  }
  if (params.wordsPerLine) {
    prompt += `Target words per line: ${params.wordsPerLine}\n`;
  }

  prompt += `\nSong structure:\n`;
  params.sections.forEach((section, index) => {
    prompt += `${index + 1}. ${section.type}\n`;
  });

  prompt += `\nPlease write appropriate lyrics for each section, following the rhyme scheme and syllable/word constraints as closely as possible.`;

  return prompt;
}
