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

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function generateLyrics(params: GenerateLyricsParams): Promise<SongSection[]> {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not found, using placeholder lyrics');
    return generatePlaceholderLyrics(params);
  }

  try {
    const prompt = buildLyricsPrompt(params);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No text generated');
    }

    return parseLyricsResponse(generatedText, params.sections);
  } catch (error) {
    console.error('Failed to generate lyrics:', error);
    return generatePlaceholderLyrics(params);
  }
}

function buildLyricsPrompt(params: GenerateLyricsParams): string {
  const sectionDescriptions = params.sections.map((s, i) => `${i + 1}. ${s.type}`).join('\n');

  return `You are a professional songwriter. Write song lyrics with these specifications:

Theme: ${params.theme || 'love and life'}
Mood: ${params.mood || 'emotional'}
Genre: ${params.genre || 'pop'}
Rhyme Scheme: ${params.rhymeScheme || 'ABAB'}
${params.syllablesPerLine ? `Target syllables per line: approximately ${params.syllablesPerLine}` : ''}
${params.wordsPerLine ? `Target words per line: approximately ${params.wordsPerLine}` : ''}

Song structure:
${sectionDescriptions}

IMPORTANT: Format your response EXACTLY like this, with each section clearly labeled:

[VERSE]
Line 1 of verse
Line 2 of verse
Line 3 of verse
Line 4 of verse

[CHORUS]
Line 1 of chorus
Line 2 of chorus
Line 3 of chorus
Line 4 of chorus

[BRIDGE]
Line 1 of bridge
Line 2 of bridge

Use the section types: INTRO, VERSE, CHORUS, BRIDGE, OUTRO
Each section should have 2-4 lines appropriate for its type.
Make the lyrics emotionally resonant, creative, and fitting for the specified genre and mood.
Follow the rhyme scheme as closely as possible.`;
}

function parseLyricsResponse(text: string, sections: SongSection[]): SongSection[] {
  const sectionRegex = /\[(INTRO|VERSE|CHORUS|BRIDGE|OUTRO)\]\s*([\s\S]*?)(?=\[(?:INTRO|VERSE|CHORUS|BRIDGE|OUTRO)\]|$)/gi;
  const parsedSections: Map<string, string[][]> = new Map();

  let match;
  while ((match = sectionRegex.exec(text)) !== null) {
    const sectionType = match[1].toLowerCase() as SongSection['type'];
    const lines = match[2]
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (!parsedSections.has(sectionType)) {
      parsedSections.set(sectionType, []);
    }
    parsedSections.get(sectionType)!.push(lines);
  }

  // Map parsed lyrics back to original sections
  const sectionCounters: Map<string, number> = new Map();

  return sections.map(section => {
    const count = sectionCounters.get(section.type) || 0;
    sectionCounters.set(section.type, count + 1);

    const availableLyrics = parsedSections.get(section.type);
    const lyrics = availableLyrics?.[count] || availableLyrics?.[0];

    return {
      ...section,
      lines: lyrics || getDefaultLines(section.type),
    };
  });
}

function getDefaultLines(sectionType: SongSection['type']): string[] {
  const defaults: Record<string, string[]> = {
    intro: ['[Intro instrumental]'],
    verse: ['[Verse lyrics]', '[Verse lyrics]', '[Verse lyrics]', '[Verse lyrics]'],
    chorus: ['[Chorus lyrics]', '[Chorus lyrics]', '[Chorus lyrics]', '[Chorus lyrics]'],
    bridge: ['[Bridge lyrics]', '[Bridge lyrics]'],
    outro: ['[Outro...]'],
  };
  return defaults[sectionType] || ['[Lyrics]'];
}

function generatePlaceholderLyrics(params: GenerateLyricsParams): SongSection[] {
  return params.sections.map((section) => ({
    ...section,
    lines: getPlaceholderLines(section.type, params),
  }));
}

function getPlaceholderLines(
  sectionType: SongSection['type'],
  params: { theme: string; mood: string }
): string[] {
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

  return placeholders[sectionType] || [`[${sectionType} lyrics]`];
}
