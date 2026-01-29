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
  const note = pitch.slice(0, -1).replace('#', '#');
  const octave = pitch.slice(-1);
  return `${note.toLowerCase()}/${octave}`;
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

      // Take first 4 quarter notes worth for a clean display
      const maxNotes = 4;
      const displayNotes = sortedNotes.slice(0, maxNotes);
      
      // Create VexFlow notes with lyrics - use all quarter notes for simplicity
      const vfNotes = displayNotes.map((note, index) => {
        const vfNote = new StaveNote({
          keys: [convertPitch(note.pitch)],
          duration: 'q'  // Force quarter notes for now to avoid timing issues
        });

        // Add lyrics as annotation below the note
        const lyric = allWords[index];
        if (lyric) {
          const annotation = new Annotation(lyric)
            .setVerticalJustification(Annotation.VerticalJustify.BOTTOM)
            .setFont('Times', 12);
          
          vfNote.addModifier(annotation);
        }

        return vfNote;
      });

      // Pad with rests if needed to fill the measure
      while (vfNotes.length < 4) {
        vfNotes.push(new StaveNote({
          keys: ['c/4'],
          duration: 'qr'  // quarter rest
        }));
      }

      if (vfNotes.length > 0) {
        // Create voice with exactly 4 beats
        const voice = new Voice({ numBeats: 4, beatValue: 4 });
        voice.setStrict(false);  // Allow incomplete measures
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