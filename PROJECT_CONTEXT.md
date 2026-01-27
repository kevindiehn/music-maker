# Music Maker - Project Context

*Last updated: January 26, 2026 by BeauBodhi*

## Overview

A web-based music composition app for creating songs from scratch: write lyrics, compose melodies, add harmonies, arrange instruments, and export.

**Live:** https://music-maker-drcep37o8-kevindiehns-projects.vercel.app
**Repo:** https://github.com/kevindiehn/music-maker

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Audio | Tone.js 15 |
| AI | Google Gemini 2.0 Flash |
| Notation | VexFlow 5 (available, not heavily used) |
| MIDI | @tonejs/midi |
| Deploy | Vercel |

## Architecture

```
src/
├── App.tsx              # Main app, all state management, 5-tab nav
├── types/index.ts       # TypeScript interfaces
├── services/
│   ├── ai.ts            # Gemini API for lyrics generation
│   ├── melody.ts        # Melody generation algorithms
│   ├── harmony.ts       # Chord progressions, harmony logic
│   ├── instruments.ts   # Instrument synth presets
│   ├── export.ts        # MIDI export, JSON save/load
│   └── syllables.ts     # Syllable counting
├── hooks/
│   └── useAudio.ts      # Tone.js playback (core audio engine)
├── utils/
│   └── musicTheory.ts   # Scales, notes, progressions data
└── components/
    ├── lyrics/          # LyricsConfig, RhymeSchemeSelector, StructureBuilder, LyricsEditor
    ├── melody/          # MelodyConfig, PianoRoll
    ├── harmony/         # ProgressionPicker, ChordSelector, ChordDisplay
    ├── instruments/     # InstrumentPicker, Mixer
    ├── export/          # ExportPanel
    └── shared/          # PlaybackControls
```

## The 5-Tab Workflow

### 1. Lyrics Tab
- Theme/mood/genre input
- Syllables/words per line constraints
- Rhyme scheme selector (ABAB, AABB, ABBA, free)
- Song structure builder (add verse/chorus/bridge/intro/outro)
- AI-generated lyrics via Gemini
- Manual lyrics editor with syllable counter

### 2. Melody Tab
- Key/scale/tempo/time signature settings
- Piano roll editor (click to add/remove notes)
- Auto-generate melody button (uses contour algorithms)
- Bars selector (2/4/8/16)
- Playback controls

### 3. Harmony Tab
- Chord progression picker (I-IV-V-I, ii-V-I, etc.)
- Chord sequence display
- Individual chord preview (click to hear)
- Play chords only / play with melody

### 4. Instruments Tab
- Instrument picker: Piano, Synth, Guitar, Bass, Drums
- Mixer with volume/mute/solo per instrument
- Instruments play melody, chords, or auto-generated bass line
- Drums auto-generate pattern

### 5. Export Tab
- Project title
- Save/load as JSON
- Export to MIDI file

## Key Data Types

```typescript
interface Note {
  pitch: string;      // e.g., "C4", "F#5"
  duration: string;   // Tone.js notation: "4n", "8n", "16n"
  startTime: string;  // Bar:beat:sixteenth, e.g., "0:0:0"
}

interface Chord {
  root: string;       // e.g., "C", "Am"
  type: string;       // "major", "minor", "7", "dim", etc.
  duration: string;
  startTime: string;
}

interface Instrument {
  id: string;
  name: string;
  type: 'melody' | 'chords' | 'bass' | 'drums';
  volume: number;     // 0-1
  muted: boolean;
  solo: boolean;
}

interface SongSection {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'outro' | 'intro';
  lines: string[];
}
```

## Audio Engine (useAudio.ts)

- Uses Tone.js for all audio synthesis
- PolySynths for melody and chords
- MembraneSynth (kick), NoiseSynth (snare), MetalSynth (hihat) for drums
- Transport-based scheduling for synchronized playback
- Supports solo/mute logic, volume control per instrument

## Melody Generation (melody.ts)

- Generates notes based on scale and key
- Rhythm patterns: weighted random (favors 8th notes)
- Contour types: ascending, descending, arch, wave, random
- Stepwise motion favored (70%) with occasional leaps (30%)
- Can sync to syllable patterns for lyrics matching

## Harmony Generation (harmony.ts)

- Built-in progressions: I-IV-V-I, ii-V-I, I-V-vi-IV, etc.
- Automatically assigns chord quality based on scale degree
- Major scale: I(maj), ii(min), iii(min), IV(maj), V(maj), vi(min), vii°(dim)
- Minor scale: i(min), ii°(dim), III(maj), iv(min), v(min), VI(maj), VII(maj)
- Chord substitution suggestions available

## Environment Variables

```bash
VITE_GEMINI_API_KEY=your_key_here
```

- Local: `.env` file (gitignored)
- Production: Vercel dashboard → Settings → Environment Variables

## Commands

```bash
cd ~/music-maker
npm run dev      # Dev server (--host for network access)
npm run build    # Production build
npm run lint     # ESLint
```

## Current State & Known Issues

### Working
- [x] Full 5-tab workflow
- [x] Melody generation and piano roll editing
- [x] Chord progression selection and playback
- [x] Multi-instrument playback with mixer
- [x] MIDI export
- [x] JSON project save/load
- [x] AI lyrics generation (when API key configured)
- [x] Deployed to Vercel

### Needs Work / Ideas
- [ ] VexFlow notation display (imported but not integrated)
- [ ] Lyrics-to-melody sync (rhythm from syllables)
- [ ] More instrument sounds / custom synth presets
- [ ] Better mobile piano roll UX
- [ ] Undo/redo for editing
- [ ] Audio recording / WAV export
- [ ] Arrangement timeline (multi-section composition)
- [ ] Chord voicing options
- [ ] Melody quantization / snap-to-grid options

## Kevin's Goals

This connects to Kevin's backburner goal: **make an afrobeats song**. Features that would help:
- Afrobeat-specific drum patterns
- Syncopated rhythm generation
- Call-and-response structure in lyrics
- Specific chord voicings common in afrobeats

---

## How to Work on This Project

1. Clone if needed: `gh repo clone kevindiehn/music-maker`
2. Install: `npm install`
3. Dev: `npm run dev`
4. Make changes
5. Test in browser (usually localhost:5173)
6. Commit and push: `git add . && git commit -m "message" && git push`
7. Vercel auto-deploys from main branch

---

*Context file created for BeauBodhi + Kevin collaboration*
