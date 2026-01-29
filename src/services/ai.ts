import type { SongSection } from '../types';

// Helper functions for section numbering
function getVerseNumber(sections: SongSection[], currentIndex: number): string {
  const versesBeforeCurrent = sections.slice(0, currentIndex).filter(s => s.type === 'verse').length;
  return `verse ${versesBeforeCurrent + 1}`;
}

function getSectionNumber(sections: SongSection[], currentIndex: number): string {
  const section = sections[currentIndex];
  const sameTypeBefore = sections.slice(0, currentIndex).filter(s => s.type === section.type).length;
  
  if (sameTypeBefore > 0) {
    return `${sameTypeBefore + 1}`;
  }
  return '';
}

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
  const sectionDescriptions = params.sections.map((s, i) => `${i + 1}. ${s.type}${s.type === 'verse' && params.sections.filter(sec => sec.type === 'verse').length > 1 ? ` (${getVerseNumber(params.sections, i)})` : ''}`).join('\n');
  
  const hasMultipleVerses = params.sections.filter(s => s.type === 'verse').length > 1;
  const hasMultipleChorus = params.sections.filter(s => s.type === 'chorus').length > 1;

  return `You are a Grammy-winning songwriter known for vivid imagery and authentic emotion. Write original song lyrics.

CREATIVE DIRECTION:
- Theme: ${params.theme || 'love and life'}
- Mood: ${params.mood || 'emotional'}
- Genre: ${params.genre || 'pop'}
- Rhyme Scheme: ${params.rhymeScheme || 'ABAB'}
${params.syllablesPerLine ? `- Target syllables per line: ~${params.syllablesPerLine}` : ''}
${params.wordsPerLine ? `- Target words per line: ~${params.wordsPerLine}` : ''}

QUALITY GUIDELINES:
- Use specific, concrete imagery instead of generic phrases (not "I feel sad" but "these four walls close in")
- Include sensory details: sights, sounds, textures, smells
- Vary sentence structure - mix short punchy lines with flowing ones
- Avoid clichés like "heart on my sleeve", "tears fall like rain", "you complete me"
- Make the chorus memorable and singable with a strong hook
- Each verse should advance the story or perspective
- Use metaphors and wordplay appropriate to the genre

🚨 CRITICAL: NO REPETITION ALLOWED!
${hasMultipleVerses ? '- Write COMPLETELY DIFFERENT verses - different scenes, perspectives, or story progression' : ''}
${hasMultipleChorus ? '- Each chorus should have slight variations - same theme but different words/angles' : ''}
- NEVER copy and paste lines between sections
- Each section must tell a unique part of the story
- Vary vocabulary, imagery, and emotional angles

Song structure:
${sectionDescriptions}

FORMAT (follow exactly):
Write each section separately with unique content.

${params.sections.map((section, index) => {
  const sectionNumber = getSectionNumber(params.sections, index);
  return `[${section.type.toUpperCase()}${sectionNumber}]
Line 1
Line 2  
Line 3
Line 4`;
}).join('\n\n')}

REMEMBER: Every section must be completely unique! No repeated lines or phrases!`;
}

function parseLyricsResponse(text: string, sections: SongSection[]): SongSection[] {
  // Updated regex to handle numbered sections like [VERSE1], [VERSE2], etc.
  const sectionRegex = /\[(INTRO|VERSE|CHORUS|BRIDGE|OUTRO)(\d*)\]\s*([\s\S]*?)(?=\[(?:INTRO|VERSE|CHORUS|BRIDGE|OUTRO)\d*\]|$)/gi;
  const parsedSections: { type: string; number: string; lines: string[] }[] = [];

  let match;
  while ((match = sectionRegex.exec(text)) !== null) {
    const sectionType = match[1].toLowerCase();
    const sectionNumber = match[2] || '1'; // Default to 1 if no number
    const lines = match[3]
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('[') && !line.startsWith('Line'));

    parsedSections.push({
      type: sectionType,
      number: sectionNumber,
      lines
    });
  }

  // Map parsed lyrics back to original sections in order
  return sections.map((section, index) => {
    // Try to find the corresponding parsed section
    const sameTypeBefore = sections.slice(0, index).filter(s => s.type === section.type).length;
    const expectedNumber = (sameTypeBefore + 1).toString();
    
    let matchedSection = parsedSections.find(p => 
      p.type === section.type && p.number === expectedNumber
    );
    
    // Fallback: try to find any section of the same type
    if (!matchedSection) {
      const availableSections = parsedSections.filter(p => p.type === section.type);
      matchedSection = availableSections[sameTypeBefore] || availableSections[0];
    }

    return {
      ...section,
      lines: matchedSection?.lines || getDefaultLines(section.type),
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
