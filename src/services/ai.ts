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
          temperature: 1.1,  // Higher creativity to avoid templates
          topK: 50,
          topP: 0.98,        // More diverse vocabulary
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

🚫 BANNED PHRASES - NEVER USE THESE:
- "Walking through the [anything]"
- "I'm feeling [emotion]"
- "Time will tell"  
- "In my heart"
- "Deep inside"
- "Looking for"
- "Searching for"
- Generic weather metaphors (rain = sadness)

✨ INSTEAD USE:
- Specific sensory details (the smell of coffee, sound of gravel)
- Action-based storytelling (she slams the door, engine won't start)
- Concrete imagery (neon signs flickering, worn leather jacket)
- Show don't tell emotions through actions/scenes

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
  _params: { theme: string; mood: string }
): string[] {
  // Much more varied placeholder templates - NO "walking through" patterns
  const placeholders: Record<string, string[][]> = {
    intro: [
      [`Shadows dance on empty walls`, `Something stirs within us all`],
      [`The clock strikes twelve again`, `Time to face what lies ahead`],
      [`Neon lights paint the street`, `Story starts where strangers meet`]
    ],
    verse: [
      [`The coffee's cold, the morning's grey`, `Another chance has slipped away`, `But in the silence something grows`, `A strength that nobody else knows`],
      [`She turns the key, the engine dies`, `Sees her reflection in his eyes`, `The radio plays their favorite song`, `Reminds her where she still belongs`],
      [`Concrete jungle, steel and glass`, `Watching memories as they pass`, `The subway rattles underground`, `In chaos, peace can still be found`]
    ],
    chorus: [
      [`Break the chains that hold you down`, `Turn the silence into sound`, `Every scar becomes a crown`, `Rising up from broken ground`],
      [`Like a phoenix from the ash`, `Nothing good was meant to last`, `But we'll build it up again`, `Stronger than we've ever been`],
      [`In the darkness find the light`, `Every wrong can still be right`, `Take my hand and hold it tight`, `Together we can win this fight`]
    ],
    bridge: [
      [`The mirror shows a different face`, `Time has left its gentle trace`],
      [`But if we learned to love again`, `Maybe we could start again`],
      [`The pieces scattered on the floor`, `Could build something worth much more`]
    ],
    outro: [
      [`The story ends but echoes on`, `In hearts where hope has never gone`],
      [`And as the final notes decay`, `The melody will find its way`],
      [`The curtain falls, the lights grow dim`, `But this is where we all begin`]
    ],
  };

  const templates = placeholders[sectionType] || [[`[${sectionType} lyrics]`]];
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  return randomTemplate;
}
