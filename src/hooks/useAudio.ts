import { useState, useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import type { Note, Chord, Instrument } from '../types';
import { getChordNotes } from '../services/harmony';
import { createInstrumentSynth, generateBassLine, generateDrumPattern } from '../services/instruments';

interface UseAudioOptions {
  tempo: number;
}

interface InstrumentSynths {
  [key: string]: {
    synth: Tone.PolySynth;
    part: Tone.Part | null;
  };
}

export function useAudio({ tempo }: UseAudioOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Legacy synths for backward compatibility
  const melodySynthRef = useRef<Tone.PolySynth | null>(null);
  const chordSynthRef = useRef<Tone.PolySynth | null>(null);
  const melodyPartRef = useRef<Tone.Part | null>(null);
  const chordPartRef = useRef<Tone.Part | null>(null);

  // Multi-instrument system
  const instrumentSynthsRef = useRef<InstrumentSynths>({});
  const drumPartsRef = useRef<{ kick?: Tone.Part; snare?: Tone.Part; hihat?: Tone.Part }>({});
  const drumSynthsRef = useRef<{ kick?: Tone.MembraneSynth; snare?: Tone.NoiseSynth; hihat?: Tone.MetalSynth }>({});

  // Initialize synths
  useEffect(() => {
    // Melody synth - brighter sound
    melodySynthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    melodySynthRef.current.set({
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.8,
      },
    });
    melodySynthRef.current.volume.value = -6;

    // Chord synth - softer pad-like sound
    chordSynthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    chordSynthRef.current.set({
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.5,
        release: 1.5,
      },
      oscillator: {
        type: 'triangle',
      },
    });
    chordSynthRef.current.volume.value = -12;

    // Drum synths
    drumSynthsRef.current.kick = new Tone.MembraneSynth().toDestination();
    drumSynthsRef.current.kick.volume.value = -6;

    drumSynthsRef.current.snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
    }).toDestination();
    drumSynthsRef.current.snare.volume.value = -10;

    drumSynthsRef.current.hihat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).toDestination();
    drumSynthsRef.current.hihat.volume.value = -18;

    setIsReady(true);

    return () => {
      melodySynthRef.current?.dispose();
      chordSynthRef.current?.dispose();
      melodyPartRef.current?.dispose();
      chordPartRef.current?.dispose();

      Object.values(instrumentSynthsRef.current).forEach(({ synth, part }) => {
        synth.dispose();
        part?.dispose();
      });

      drumSynthsRef.current.kick?.dispose();
      drumSynthsRef.current.snare?.dispose();
      drumSynthsRef.current.hihat?.dispose();
      drumPartsRef.current.kick?.dispose();
      drumPartsRef.current.snare?.dispose();
      drumPartsRef.current.hihat?.dispose();
    };
  }, []);

  // Update tempo
  useEffect(() => {
    Tone.getTransport().bpm.value = tempo;
  }, [tempo]);

  const scheduleMelody = useCallback((notes: Note[]) => {
    if (melodyPartRef.current) {
      melodyPartRef.current.dispose();
    }

    if (notes.length === 0 || !melodySynthRef.current) return;

    const events = notes.map((note) => ({
      time: note.startTime,
      pitch: note.pitch,
      duration: note.duration,
    }));

    melodyPartRef.current = new Tone.Part((time, event) => {
      melodySynthRef.current?.triggerAttackRelease(event.pitch, event.duration, time);
    }, events);

    melodyPartRef.current.start(0);
  }, []);

  const scheduleChords = useCallback((chords: Chord[]) => {
    if (chordPartRef.current) {
      chordPartRef.current.dispose();
    }

    if (chords.length === 0 || !chordSynthRef.current) return;

    const events = chords.map((chord) => ({
      time: chord.startTime,
      notes: getChordNotes(chord.root, chord.type, 3),
      duration: chord.duration,
    }));

    chordPartRef.current = new Tone.Part((time, event) => {
      chordSynthRef.current?.triggerAttackRelease(event.notes, event.duration, time);
    }, events);

    chordPartRef.current.start(0);
  }, []);

  // Schedule with custom instruments
  const scheduleWithInstruments = useCallback((
    notes: Note[],
    chords: Chord[],
    instruments: Instrument[],
    bars: number
  ) => {
    // Dispose existing instrument parts
    Object.values(instrumentSynthsRef.current).forEach(({ synth, part }) => {
      synth.dispose();
      part?.dispose();
    });
    instrumentSynthsRef.current = {};

    // Dispose drum parts
    drumPartsRef.current.kick?.dispose();
    drumPartsRef.current.snare?.dispose();
    drumPartsRef.current.hihat?.dispose();

    const hasSolo = instruments.some((i) => i.solo);

    instruments.forEach((instrument) => {
      // Check if audible
      const isAudible = !instrument.muted && (!hasSolo || instrument.solo);
      if (!isAudible) return;

      if (instrument.type === 'drums') {
        // Schedule drums
        const pattern = generateDrumPattern(bars);

        if (drumSynthsRef.current.kick) {
          drumSynthsRef.current.kick.volume.value = -6 + (instrument.volume - 0.7) * 20;
          drumPartsRef.current.kick = new Tone.Part((time) => {
            drumSynthsRef.current.kick?.triggerAttackRelease('C1', '8n', time);
          }, pattern.kick.map((t) => [t]));
          drumPartsRef.current.kick.start(0);
        }

        if (drumSynthsRef.current.snare) {
          drumSynthsRef.current.snare.volume.value = -10 + (instrument.volume - 0.7) * 20;
          drumPartsRef.current.snare = new Tone.Part((time) => {
            drumSynthsRef.current.snare?.triggerAttackRelease('8n', time);
          }, pattern.snare.map((t) => [t]));
          drumPartsRef.current.snare.start(0);
        }

        if (drumSynthsRef.current.hihat) {
          drumSynthsRef.current.hihat.volume.value = -18 + (instrument.volume - 0.7) * 20;
          drumPartsRef.current.hihat = new Tone.Part((time) => {
            drumSynthsRef.current.hihat?.triggerAttack(time);
          }, pattern.hihat.map((t) => [t]));
          drumPartsRef.current.hihat.start(0);
        }

        return;
      }

      // Create synth for this instrument
      const synth = createInstrumentSynth(instrument.id);
      synth.toDestination();

      // Set volume based on instrument settings
      const baseVolume = instrument.type === 'bass' ? -12 : instrument.type === 'chords' ? -10 : -6;
      synth.volume.value = baseVolume + (instrument.volume - 0.7) * 20;

      let events: { time: string; notes: string | string[]; duration: string }[] = [];

      if (instrument.type === 'melody' && notes.length > 0) {
        events = notes.map((note) => ({
          time: note.startTime,
          notes: note.pitch,
          duration: note.duration,
        }));
      } else if (instrument.type === 'chords' && chords.length > 0) {
        events = chords.map((chord) => ({
          time: chord.startTime,
          notes: getChordNotes(chord.root, chord.type, 3),
          duration: chord.duration,
        }));
      } else if (instrument.type === 'bass' && chords.length > 0) {
        const bassLine = generateBassLine(chords);
        events = bassLine.map((note) => ({
          time: note.startTime,
          notes: note.pitch,
          duration: note.duration,
        }));
      }

      if (events.length > 0) {
        const part = new Tone.Part((time, event) => {
          synth.triggerAttackRelease(event.notes, event.duration, time);
        }, events);
        part.start(0);

        instrumentSynthsRef.current[instrument.id] = { synth, part };
      } else {
        instrumentSynthsRef.current[instrument.id] = { synth, part: null };
      }
    });
  }, []);

  const play = useCallback(async (notes: Note[], chords: Chord[] = []) => {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }

    Tone.getTransport().stop();
    Tone.getTransport().position = 0;

    scheduleMelody(notes);
    scheduleChords(chords);
    Tone.getTransport().start();
    setIsPlaying(true);
  }, [scheduleMelody, scheduleChords]);

  const playWithInstruments = useCallback(async (
    notes: Note[],
    chords: Chord[],
    instruments: Instrument[],
    bars: number
  ) => {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }

    Tone.getTransport().stop();
    Tone.getTransport().position = 0;

    // Clear legacy parts
    melodyPartRef.current?.dispose();
    melodyPartRef.current = null;
    chordPartRef.current?.dispose();
    chordPartRef.current = null;

    scheduleWithInstruments(notes, chords, instruments, bars);
    Tone.getTransport().start();
    setIsPlaying(true);
  }, [scheduleWithInstruments]);

  const playMelodyOnly = useCallback(async (notes: Note[]) => {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }

    Tone.getTransport().stop();
    Tone.getTransport().position = 0;

    if (chordPartRef.current) {
      chordPartRef.current.dispose();
      chordPartRef.current = null;
    }

    scheduleMelody(notes);
    Tone.getTransport().start();
    setIsPlaying(true);
  }, [scheduleMelody]);

  const playChordsOnly = useCallback(async (chords: Chord[]) => {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }

    Tone.getTransport().stop();
    Tone.getTransport().position = 0;

    if (melodyPartRef.current) {
      melodyPartRef.current.dispose();
      melodyPartRef.current = null;
    }

    scheduleChords(chords);
    Tone.getTransport().start();
    setIsPlaying(true);
  }, [scheduleChords]);

  const pause = useCallback(() => {
    Tone.getTransport().pause();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    setIsPlaying(false);
  }, []);

  const playNote = useCallback(async (pitch: string, duration: string = '8n') => {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }
    melodySynthRef.current?.triggerAttackRelease(pitch, duration);
  }, []);

  const playChord = useCallback(async (root: string, type: string, duration: string = '2n') => {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }
    const notes = getChordNotes(root, type, 3);
    chordSynthRef.current?.triggerAttackRelease(notes, duration);
  }, []);

  const initAudio = useCallback(async () => {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }
  }, []);

  return {
    isPlaying,
    isReady,
    play,
    playWithInstruments,
    playMelodyOnly,
    playChordsOnly,
    pause,
    stop,
    playNote,
    playChord,
    initAudio,
  };
}
