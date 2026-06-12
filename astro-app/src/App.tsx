import { useState } from 'react';
import './index.css';
import SynastryView from './components/SynastryView';
import TransitView from './components/TransitView';

type Tab = 'synastry' | 'transits';

export default function App() {
  const [tab, setTab] = useState<Tab>('synastry');

  return (
    <div className="min-h-screen bg-[#060810]">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✦</span>
            <div>
              <h1 className="text-lg font-semibold text-slate-100 leading-none">Astro Companion</h1>
              <p className="text-xs text-slate-500 mt-0.5">Synastry · Transits</p>
            </div>
          </div>
          <nav className="flex gap-1">
            {(['synastry', 'transits'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  tab === t
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'synastry' ? '♥ Synastry' : '◎ Transits'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Subtle star field background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() > 0.8 ? 2 : 1,
              height: Math.random() > 0.8 ? 2 : 1,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.4 + 0.1,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <main className="relative max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          {tab === 'synastry' ? (
            <>
              <h2 className="text-2xl font-light text-slate-200">Relationship Compatibility</h2>
              <p className="text-slate-500 text-sm mt-1">Enter two birth charts to reveal your synastry aspects and compatibility score</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-light text-slate-200">Current Transits</h2>
              <p className="text-slate-500 text-sm mt-1">See what the sky is activating in your natal chart right now</p>
            </>
          )}
        </div>

        {tab === 'synastry' ? <SynastryView /> : <TransitView />}
      </main>

      <footer className="text-center py-8 text-xs text-slate-700">
        Powered by kerykeion · Swiss Ephemeris
      </footer>
    </div>
  );
}
