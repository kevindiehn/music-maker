import * as Tone from 'tone';

export type InstrumentPreset = {
  id: string;
  name: string;
  createSynth: () => Tone.PolySynth | Tone.MembraneSynth | Tone.MetalSynth;
};

// Synth presets for different instruments
export const INSTRUMENT_PRESETS: Record<string, () => Tone.PolySynth> = {
  // Melody instruments
  'piano': () => {
    const synth = new Tone.PolySynth(Tone.Synth);
    synth.set({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,
        decay: 0.3,
        sustain: 0.2,
        release: 1,
      },
    });
    return synth;
  },

  'synth-lead': () => {
    const synth = new Tone.PolySynth(Tone.Synth);
    synth.set({
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.5,
        release: 0.5,
      },
    });
    return synth;
  },

  // Chord instruments
  'acoustic-guitar': () => {
    const synth = new Tone.PolySynth(Tone.Synth);
    synth.set({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.4,
        sustain: 0.1,
        release: 0.8,
      },
    });
    return synth;
  },

  'electric-guitar': () => {
    const synth = new Tone.PolySynth(Tone.Synth);
    synth.set({
      oscillator: { type: 'square' },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.4,
        release: 0.5,
      },
    });
    return synth;
  },

  'synth-pad': () => {
    const synth = new Tone.PolySynth(Tone.Synth);
    synth.set({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.5,
        decay: 0.5,
        sustain: 0.8,
        release: 2,
      },
    });
    return synth;
  },

  'strings': () => {
    const synth = new Tone.PolySynth(Tone.Synth);
    synth.set({
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.3,
        decay: 0.3,
        sustain: 0.7,
        release: 1.5,
      },
    });
    return synth;
  },

  // Bass instruments
  'bass': () => {
    const synth = new Tone.PolySynth(Tone.Synth);
    synth.set({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.4,
        release: 0.5,
      },
    });
    return synth;
  },

  'synth-bass': () => {
    const synth = new Tone.PolySynth(Tone.Synth);
    synth.set({
      oscillator: { type: 'square' },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.5,
        release: 0.3,
      },
    });
    return synth;
  },

  // Default fallback
  'default': () => {
    const synth = new Tone.PolySynth(Tone.Synth);
    synth.set({
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.8,
      },
    });
    return synth;
  },
};

export function createInstrumentSynth(instrumentId: string): Tone.PolySynth {
  const preset = INSTRUMENT_PRESETS[instrumentId] || INSTRUMENT_PRESETS['default'];
  return preset();
}

// Simple drum sounds using Tone.js built-in synths
export function createDrumKit() {
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 5,
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.001,
      decay: 0.4,
      sustain: 0.01,
      release: 1.4,
    },
  });

  const snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: {
      attack: 0.001,
      decay: 0.2,
      sustain: 0,
      release: 0.2,
    },
  });

  const hihat = new Tone.MetalSynth({
    envelope: {
      attack: 0.001,
      decay: 0.1,
      release: 0.01,
    },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  });

  return { kick, snare, hihat };
}

// Generate a simple bass line from chord progression
export function generateBassLine(
  chords: { root: string; startTime: string; duration: string }[]
): { pitch: string; startTime: string; duration: string }[] {
  return chords.map((chord) => ({
    pitch: `${chord.root}2`, // Bass octave
    startTime: chord.startTime,
    duration: chord.duration,
  }));
}

// Generate a simple drum pattern
export function generateDrumPattern(bars: number, timeSignature: [number, number] = [4, 4]): {
  kick: string[];
  snare: string[];
  hihat: string[];
} {
  const beatsPerBar = timeSignature[0];
  const pattern = {
    kick: [] as string[],
    snare: [] as string[],
    hihat: [] as string[],
  };

  for (let bar = 0; bar < bars; bar++) {
    for (let beat = 0; beat < beatsPerBar; beat++) {
      const time = `${bar}:${beat}:0`;

      // Kick on 1 and 3
      if (beat === 0 || beat === 2) {
        pattern.kick.push(time);
      }

      // Snare on 2 and 4
      if (beat === 1 || beat === 3) {
        pattern.snare.push(time);
      }

      // Hi-hat on every 8th note
      pattern.hihat.push(time);
      pattern.hihat.push(`${bar}:${beat}:2`);
    }
  }

  return pattern;
}
