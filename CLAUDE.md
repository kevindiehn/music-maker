# Music Maker - Project Context

## What This Is
A web app for creating music - write lyrics, compose melodies, add harmonies, pick instruments, and export.

## Tech Stack
- React 19 + TypeScript + Vite 7
- Tone.js for audio synthesis
- Tailwind CSS 4
- Google Gemini 2.0 Flash for AI lyrics generation
- VexFlow for music notation (available but not heavily used yet)

## Live URLs
- **GitHub**: https://github.com/kevindiehn/music-maker
- **Vercel**: https://music-maker-drcep37o8-kevindiehns-projects.vercel.app

## App Structure (5 tabs)
1. **Lyrics** - Theme/mood/genre settings, rhyme scheme, song structure builder, AI-generated lyrics via Gemini
2. **Melody** - Piano roll editor, key/scale/tempo settings, auto-generate melodies
3. **Harmony** - Chord progression picker, chord sequence display
4. **Instruments** - Pick instruments (piano, synth, guitar, bass, drums), mixer with volume/mute/solo
5. **Export** - Save/load projects as JSON, export to MIDI

## Key Files
- `src/App.tsx` - Main app with all state and 5-tab navigation
- `src/services/ai.ts` - Gemini API integration for lyrics
- `src/services/melody.ts` - Melody generation logic
- `src/services/harmony.ts` - Chord progressions and harmony
- `src/services/instruments.ts` - Instrument synth presets
- `src/services/export.ts` - MIDI export and project save/load
- `src/hooks/useAudio.ts` - Tone.js audio playback hook
- `src/types/index.ts` - TypeScript interfaces

## Environment Variables
- `VITE_GEMINI_API_KEY` - Google Gemini API key for lyrics generation
- Local: stored in `.env` (gitignored)
- Production: must be added in Vercel dashboard → Settings → Environment Variables

## Current Status (Jan 21, 2026)

### Completed This Session
- Found project after crash recovery
- Set up GitHub repo and pushed code
- Deployed to Vercel
- Installed GitHub CLI (`gh`)
- Integrated Google Gemini API for AI lyrics generation

### Pending
- [ ] Add `VITE_GEMINI_API_KEY` to Vercel environment variables and redeploy
- [ ] Test AI lyrics generation on live site

## Commands
```bash
cd ~/music-maker
npm run dev      # Start dev server (exposes to network via --host)
npm run build    # Production build
npm run lint     # ESLint
```

## Notes
- Dev server uses `--host` flag by default for phone testing on same WiFi
- Node.js version warning (have 20.13.1, Vite wants 20.19+) - works fine
- Build has chunk size warning (541KB) - non-critical, could code-split later
