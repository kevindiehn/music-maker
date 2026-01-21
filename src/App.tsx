import { useState } from 'react'
import './App.css'
import type { SongSection, Note, Chord, Instrument, MelodyConfig as MelodyConfigType } from './types'
import { LyricsConfig } from './components/lyrics/LyricsConfig'
import { RhymeSchemeSelector } from './components/lyrics/RhymeSchemeSelector'
import { StructureBuilder } from './components/lyrics/StructureBuilder'
import { LyricsEditor } from './components/lyrics/LyricsEditor'
import { MelodyConfig } from './components/melody/MelodyConfig'
import { PianoRoll } from './components/melody/PianoRoll'
import { PlaybackControls } from './components/shared/PlaybackControls'
import { ProgressionPicker } from './components/harmony/ProgressionPicker'
import { ChordDisplay } from './components/harmony/ChordDisplay'
import { InstrumentPicker } from './components/instruments/InstrumentPicker'
import { Mixer } from './components/instruments/Mixer'
import { ExportPanel } from './components/export/ExportPanel'
import type { ProjectData } from './services/export'
import { generateLyrics } from './services/ai'
import { generateMelody } from './services/melody'
import { generateHarmony } from './services/harmony'
import { useAudio } from './hooks/useAudio'

type AppStep = 'lyrics' | 'melody' | 'harmony' | 'instruments' | 'export'

interface LyricsState {
  theme: string
  mood: string
  genre: string
  syllablesPerLine: number | null
  wordsPerLine: number | null
  rhymeScheme: string
  sections: SongSection[]
}

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('lyrics')
  const [isGenerating, setIsGenerating] = useState(false)
  const [projectTitle, setProjectTitle] = useState('My Song')
  const [lyricsState, setLyricsState] = useState<LyricsState>({
    theme: '',
    mood: '',
    genre: '',
    syllablesPerLine: null,
    wordsPerLine: null,
    rhymeScheme: 'ABAB',
    sections: [],
  })

  const [melodyConfig, setMelodyConfig] = useState<MelodyConfigType>({
    key: 'C',
    scale: 'major',
    tempo: 120,
    timeSignature: [4, 4] as [number, number],
  })

  const [melodyNotes, setMelodyNotes] = useState<Note[]>([])
  const [melodyBars, setMelodyBars] = useState(4)

  const [chords, setChords] = useState<Chord[]>([])
  const [selectedProgression, setSelectedProgression] = useState<string | null>(null)

  const [instruments, setInstruments] = useState<Instrument[]>([])

  const { isPlaying, play, playMelodyOnly, playChordsOnly, playWithInstruments, pause, stop, playChord } = useAudio({ tempo: melodyConfig.tempo })

  const steps: { id: AppStep; label: string }[] = [
    { id: 'lyrics', label: 'Lyrics' },
    { id: 'melody', label: 'Melody' },
    { id: 'harmony', label: 'Harmony' },
    { id: 'instruments', label: 'Instruments' },
    { id: 'export', label: 'Export' },
  ]

  const handleGenerateLyrics = async () => {
    if (lyricsState.sections.length === 0) {
      alert('Please add at least one section to your song structure')
      return
    }

    setIsGenerating(true)
    try {
      const generatedSections = await generateLyrics(lyricsState)
      setLyricsState((prev) => ({ ...prev, sections: generatedSections }))
    } catch (error) {
      console.error('Failed to generate lyrics:', error)
      alert('Failed to generate lyrics. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateMelody = () => {
    const notes = generateMelody({
      config: melodyConfig,
      bars: melodyBars,
    })
    setMelodyNotes(notes)
  }

  const handlePlayMelody = () => {
    playMelodyOnly(melodyNotes)
  }

  const handleSelectProgression = (progressionName: string) => {
    setSelectedProgression(progressionName)
    const generatedChords = generateHarmony({
      key: melodyConfig.key,
      scale: melodyConfig.scale,
      progressionName,
      bars: melodyBars,
    })
    setChords(generatedChords)
  }

  const handlePlayChords = () => {
    playChordsOnly(chords)
  }

  const handlePlayAll = () => {
    play(melodyNotes, chords)
  }

  const handlePreviewChord = (chord: Chord) => {
    playChord(chord.root, chord.type)
  }

  const handlePlayWithInstruments = () => {
    playWithInstruments(melodyNotes, chords, instruments, melodyBars)
  }

  const handleLoadProject = (data: ProjectData) => {
    setProjectTitle(data.title)
    setLyricsState(data.lyrics)
    setMelodyConfig(data.melody.config)
    setMelodyNotes(data.melody.notes)
    setMelodyBars(data.melody.bars)
    setChords(data.harmony.chords)
    setSelectedProgression(data.harmony.progressionName)
    setInstruments(data.instruments)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <h1 className="text-2xl font-bold text-center">Music Maker</h1>
      </header>

      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="flex justify-center gap-1 p-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentStep === step.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="mr-2">{index + 1}.</span>
              {step.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="container mx-auto p-6 max-w-4xl">
        {currentStep === 'lyrics' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Song Settings</h2>
              <LyricsConfig
                config={{
                  theme: lyricsState.theme,
                  mood: lyricsState.mood,
                  genre: lyricsState.genre,
                  syllablesPerLine: lyricsState.syllablesPerLine,
                  wordsPerLine: lyricsState.wordsPerLine,
                }}
                onChange={(config) => setLyricsState((prev) => ({ ...prev, ...config }))}
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <RhymeSchemeSelector
                value={lyricsState.rhymeScheme}
                onChange={(rhymeScheme) => setLyricsState((prev) => ({ ...prev, rhymeScheme }))}
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <StructureBuilder
                sections={lyricsState.sections}
                onChange={(sections) => setLyricsState((prev) => ({ ...prev, sections }))}
              />
            </div>

            {lyricsState.sections.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={handleGenerateLyrics}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                >
                  {isGenerating ? 'Generating...' : 'Generate Lyrics with AI'}
                </button>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Lyrics Editor</h2>
              <LyricsEditor
                sections={lyricsState.sections}
                onChange={(sections) => setLyricsState((prev) => ({ ...prev, sections }))}
                targetSyllables={lyricsState.syllablesPerLine}
                targetWords={lyricsState.wordsPerLine}
              />
            </div>
          </div>
        )}

        {currentStep === 'melody' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Melody Settings</h2>
              <MelodyConfig
                config={melodyConfig}
                onChange={setMelodyConfig}
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Piano Roll</h2>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Bars:</span>
                    <select
                      value={melodyBars}
                      onChange={(e) => setMelodyBars(Number(e.target.value))}
                      className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      {[2, 4, 8, 16].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    onClick={handleGenerateMelody}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Generate Melody
                  </button>
                  <button
                    onClick={() => setMelodyNotes([])}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <PianoRoll
                notes={melodyNotes}
                onChange={setMelodyNotes}
                bars={melodyBars}
                lyrics={lyricsState.sections}
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Playback</h2>
                <PlaybackControls
                  isPlaying={isPlaying}
                  onPlay={handlePlayMelody}
                  onPause={pause}
                  onStop={stop}
                  tempo={melodyConfig.tempo}
                  onTempoChange={(tempo) => setMelodyConfig((prev) => ({ ...prev, tempo }))}
                  disabled={melodyNotes.length === 0}
                />
              </div>
              {melodyNotes.length === 0 && (
                <p className="text-gray-500 text-sm mt-2">
                  Generate a melody or click on the piano roll to add notes
                </p>
              )}
              {melodyNotes.length > 0 && (
                <p className="text-gray-400 text-sm mt-2">
                  {melodyNotes.length} notes • {melodyConfig.key} {melodyConfig.scale} • {melodyConfig.tempo} BPM
                </p>
              )}
            </div>
          </div>
        )}

        {currentStep === 'harmony' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Chord Progressions</h2>
              <ProgressionPicker
                selectedProgression={selectedProgression}
                onSelect={handleSelectProgression}
                musicKey={melodyConfig.key}
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Chord Sequence</h2>
                <button
                  onClick={() => setChords([])}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium transition-colors"
                >
                  Clear All
                </button>
              </div>
              <ChordDisplay
                chords={chords}
                onChange={setChords}
                bars={melodyBars}
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Playback</h2>
                <div className="flex items-center gap-4">
                  <PlaybackControls
                    isPlaying={isPlaying}
                    onPlay={handlePlayChords}
                    onPause={pause}
                    onStop={stop}
                    tempo={melodyConfig.tempo}
                    onTempoChange={(tempo) => setMelodyConfig((prev) => ({ ...prev, tempo }))}
                    disabled={chords.length === 0}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-4">
                <button
                  onClick={handlePlayChords}
                  disabled={chords.length === 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                >
                  Play Chords Only
                </button>
                <button
                  onClick={handlePlayAll}
                  disabled={chords.length === 0 && melodyNotes.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                >
                  Play Melody + Chords
                </button>
              </div>

              {chords.length > 0 && (
                <div className="mt-4">
                  <p className="text-gray-400 text-sm mb-2">Click a chord to preview:</p>
                  <div className="flex flex-wrap gap-2">
                    {chords.map((chord, index) => (
                      <button
                        key={index}
                        onClick={() => handlePreviewChord(chord)}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                      >
                        {chord.root}{chord.type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 'instruments' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Select Instruments</h2>
              <InstrumentPicker
                instruments={instruments}
                onChange={setInstruments}
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Mixer</h2>
              <Mixer
                instruments={instruments}
                onChange={setInstruments}
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Playback</h2>
                <PlaybackControls
                  isPlaying={isPlaying}
                  onPlay={handlePlayWithInstruments}
                  onPause={pause}
                  onStop={stop}
                  tempo={melodyConfig.tempo}
                  onTempoChange={(tempo) => setMelodyConfig((prev) => ({ ...prev, tempo }))}
                  disabled={instruments.length === 0}
                />
              </div>

              <div className="mt-4">
                {instruments.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Select instruments above to hear your arrangement
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">
                      {instruments.length} instrument{instruments.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {instruments.map((inst) => (
                        <span
                          key={inst.id}
                          className={`px-2 py-1 rounded text-xs ${
                            inst.muted ? 'bg-gray-700 text-gray-500' : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {inst.name}
                          {inst.solo && ' (solo)'}
                          {inst.muted && ' (muted)'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {(melodyNotes.length === 0 && chords.length === 0) && (
                <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    Tip: Create a melody and/or chords first for the instruments to play!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 'export' && (
          <ExportPanel
            projectTitle={projectTitle}
            onProjectTitleChange={setProjectTitle}
            lyrics={lyricsState}
            melody={{
              config: melodyConfig,
              notes: melodyNotes,
              bars: melodyBars,
            }}
            harmony={{
              chords,
              progressionName: selectedProgression,
            }}
            instruments={instruments}
            onLoadProject={handleLoadProject}
          />
        )}
      </main>
    </div>
  )
}

export default App
