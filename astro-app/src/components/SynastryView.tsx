import { useState } from 'react';
import type { BirthData, SynastryResponse } from '../types';
import BirthForm from './BirthForm';
import AspectBadge from './AspectBadge';
import { api } from '../api';

const SCORE_COLOR = (n: number) =>
  n >= 25 ? 'text-amber-300' : n >= 15 ? 'text-purple-300' : n >= 8 ? 'text-emerald-300' : 'text-slate-400';

const SCORE_STARS = (desc: string) => {
  const map: Record<string, string> = {
    'Minimal': '★☆☆☆☆',
    'Medium': '★★☆☆☆',
    'Important': '★★★☆☆',
    'Very Important': '★★★★☆',
    'Exceptional': '★★★★★',
    'Rare Exceptional': '✦★★★★★',
  };
  return map[desc] ?? desc;
};

export default function SynastryView() {
  const [p1, setP1] = useState<Partial<BirthData>>({});
  const [p2, setP2] = useState<Partial<BirthData>>({});
  const [result, setResult] = useState<SynastryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showChart, setShowChart] = useState(false);

  async function submit() {
    if (!p1.name || !p2.name) { setError('Please fill in both names.'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await api.synastry(p1 as BirthData, p2 as BirthData);
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BirthForm label="Person 1" value={p1} onChange={setP1} />
        <BirthForm label="Person 2" value={p2} onChange={setP2} />
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <button
        onClick={submit}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-600/20 border border-amber-500/30 text-amber-300 font-medium hover:from-amber-500/30 hover:to-purple-600/30 transition-all disabled:opacity-50"
      >
        {loading ? 'Calculating…' : 'Calculate Compatibility'}
      </button>

      {result && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Score card */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 text-center">
            <div className="text-5xl font-light mb-2">
              <span className={SCORE_COLOR(result.score_value)}>{result.score_value}</span>
            </div>
            <div className="text-lg text-slate-300 mb-1">{result.score_description}</div>
            <div className="text-amber-400/80 text-sm tracking-wider">{SCORE_STARS(result.score_description)}</div>
            {result.is_destiny_sign && (
              <div className="mt-3 inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                ✦ Destiny Sign
              </div>
            )}
          </div>

          {/* Aspects table */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">
                Synastry Aspects <span className="text-slate-500">({result.aspects.length})</span>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-800">
                    <th className="px-4 py-2 text-left">{result.aspects[0]?.p1_owner ?? 'Person 1'}</th>
                    <th className="px-4 py-2 text-center">Aspect</th>
                    <th className="px-4 py-2 text-left">{result.aspects[0]?.p2_owner ?? 'Person 2'}</th>
                    <th className="px-4 py-2 text-right">Orb</th>
                    <th className="px-4 py-2 text-right">Movement</th>
                  </tr>
                </thead>
                <tbody>
                  {result.aspects.map((a, i) => (
                    <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                      <td className="px-4 py-2 text-slate-200">{a.p1_name}</td>
                      <td className="px-4 py-2 text-center"><AspectBadge aspect={a.aspect} /></td>
                      <td className="px-4 py-2 text-slate-200">{a.p2_name}</td>
                      <td className="px-4 py-2 text-right text-slate-400 font-mono text-xs">{a.orbit}°</td>
                      <td className="px-4 py-2 text-right text-slate-500 text-xs">{a.aspect_movement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SVG chart toggle */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 overflow-hidden">
            <button
              onClick={() => setShowChart(!showChart)}
              className="w-full px-5 py-3 text-sm font-medium text-slate-300 hover:text-amber-400 transition-colors flex items-center justify-between"
            >
              <span>Chart Wheel</span>
              <span className="text-slate-500">{showChart ? '▲' : '▼'}</span>
            </button>
            {showChart && (
              <div
                className="p-4 overflow-auto"
                dangerouslySetInnerHTML={{ __html: result.svg_chart }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
