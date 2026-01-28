import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Annotation } from 'vexflow';
import type { Note, SongSection } from '../../types';
import { extractAllWords } from '../../services/syllables';

interface NotationViewProps {
  notes: Note[];
  lyrics?: SongSection[];
  playbackTime?: string;
}

// Convert our pitch format (C4, D#5) to VexFlow format
const convertPitch = (pitch: string): string => {
  const note = pitch.slice(0, -1);
  const octave = pitch.slice(-1);
  return `${note.toLowerCase()}/${octave}`;
};

// Convert our duration format to VexFlow format  
const convertDuration = (duration: string): string => {
  switch (duration) {
    case '1n': return 'w';     // whole note
    case '2n': return 'h';     // half note
    case '4n': return 'q';     // quarter note
    case '8n': return '8';     // eighth note
    case '16n': return '16';   // sixteenth note
    default: return 'q';
  }
};

export function NotationView({ notes, lyrics = [], playbackTime }: NotationViewProps) {
  const divRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!divRef.current) return;

    // Clear previous notation
    divRef.current.innerHTML = '';

    // Extract lyrics words for mapping to notes
    const allWords = lyrics.flatMap((section) => extractAllWords(section.lines));
    
    // Sort notes by start time
    const sortedNotes = [...notes].sort((a, b) => {
      const parseTime = (t: string) => {
        const [bar, beat, sixteenth] = t.split(':').map(Number);
        return bar * 16 + beat * 4 + sixteenth;
      };
      return parseTime(a.startTime) - parseTime(b.startTime);
    });

    if (sortedNotes.length === 0) {
      divRef.current.innerHTML = '<div class="text-gray-500 text-center py-8">Add notes to see notation</div>';
      return;
    }

    try {
      // Create VexFlow renderer
      const renderer = new Renderer(divRef.current, Renderer.Backends.SVG);
      renderer.resize(800, 300);
      const context = renderer.getContext();

      // Create stave
      const stave = new Stave(10, 40, 700);
      stave.addClef('treble');
      stave.setContext(context).draw();

      // Create VexFlow notes with lyrics
      const vfNotes = sortedNotes.slice(0, 8).map((note, index) => { // Limit to 8 notes for demo
        const vfNote = new StaveNote({
          keys: [convertPitch(note.pitch)],
          duration: convertDuration(note.duration)
        });

        // Add lyrics as annotation below the note
        const lyric = allWords[index];
        if (lyric) {
          const annotation = new Annotation(lyric)
            .setVerticalJustification(Annotation.VerticalJustify.BOTTOM);
          
          vfNote.addModifier(annotation);
        }

        return vfNote;
      });

      if (vfNotes.length > 0) {
        // Create voice and add notes
        const voice = new Voice({ numBeats: 4, beatValue: 4 });
        voice.addTickables(vfNotes);

        // Format and draw
        new Formatter().joinVoices([voice]).format([voice], 600);
        voice.draw(context, stave);
      }

    } catch (error) {
      console.error('VexFlow rendering error:', error);
      if (divRef.current) {
        divRef.current.innerHTML = '<div class="text-red-500 text-center py-8">Error rendering notation</div>';
      }
    }
  }, [notes, lyrics, playbackTime]);

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Sheet Music</h3>
        <div className="text-sm text-gray-600">
          {notes.length} notes • {lyrics.flatMap(s => extractAllWords(s.lines)).length} lyrics
        </div>
      </div>
      <div ref={divRef} className="overflow-x-auto min-h-[200px] flex items-center justify-center" />
    </div>
  );
}