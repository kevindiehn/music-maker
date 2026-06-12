import { useState } from 'react';
import type { BirthData, TransitResponse, UpcomingDay } from '../types';
import BirthForm from './BirthForm';
import AspectBadge from './AspectBadge';
import { api } from '../api';

export default function TransitView() {
  const [person, setPerson] = useState<Partial<BirthData>>({});
  const [obsLng, setObsLng] = useState(0);
  const [obsLat, setObsLat] = useState(0);
  const [obsTz, setObsTz] = useState('UTC');
  const [result, setResult] = useState<TransitResponse | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [error, setError] = useState('');
  const [showChart, setShowChart] = useState(false);

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setObsLng(pos.coords.longitude);
      setObsLat(pos.coords.latitude);
      setObsTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    });
  }

  async function submit() {
    if (!person.name) { setError('Please fill in your birth details.'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await api.transits(person as BirthData, obsLng, obsLat, obsTz);
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadUpcoming() {
    if (!person.name) return;
    setLoadingUpcoming(true);
    try {
      const data = await api.upcomingTransits(person as BirthData, obsLng, obsLat, obsTz, 30);
      setUpcoming(data.upcoming);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingUpcoming(false);
    }
  }

  const input = 'bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500/60 w-full';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BirthForm label="Your Birth Chart" value={person} onChange={setPerson} />

        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-amber-400/70">Observer Location</div>
          <p className="text-xs text-slate-500">Where you are now — affects house positions for transit chart.</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Latitude</label>
              <input type="number" step="0.0001" className={input} value={obsLat}
                onChange={(e) => setObsLat(+e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Longitude</label>
              <input type="number" step="0.0001" className={input} value={obsLng}
                onChange={(e) => setObsLng(+e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Timezone</label>
            <input className={input} value={obsTz} onChange={(e) => setObsTz(e.target.value)} />
          </div>
          <button type="button" onClick={useMyLocation}
            className="w-full text-xs text-slate-400 hover:text-amber-400 transition-colors py-1 flex items-center justify-center gap-1.5">
            <span>◎</span> Use my current location
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <div className="flex gap-3">
        <button onClick={submit} disabled={loading}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 text-purple-300 font-medium hover:from-purple-600/30 hover:to-indigo-600/30 transition-all disabled:opacity-50">
          {loading ? 'Calculating…' : 'Current Transits'}
        </button>
        <button onClick={loadUpcoming} disabled={loadingUpcoming || !result}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600/20 to-slate-600/20 border border-indigo-500/30 text-indigo-300 font-medium hover:opacity-80 transition-all disabled:opacity-40">
          {loadingUpcoming ? 'Loading…' : '30-Day Forecast'}
        </button>
      </div>

      {result && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="text-xs text-slate-500 text-center">
            As of {new Date(result.as_of).toLocaleString()} UTC
          </div>

          {/* Current aspects */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700/50 text-sm font-medium text-slate-300">
              Active Transits <span className="text-slate-500">({result.aspects.filter(a => Math.abs(a.orbit) < 3).length} within 3°)</span>
            </div>
            <div className="divide-y divide-slate-800/60">
              {result.aspects
                .filter((a) => Math.abs(a.orbit) < 3)
                .sort((a, b) => Math.abs(a.orbit) - Math.abs(b.orbit))
                .map((a, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-800/30">
                    <div className="flex-1 text-sm text-slate-200">
                      <span className="text-slate-400 text-xs mr-1">Transit</span>{a.p2_name}
                    </div>
                    <AspectBadge aspect={a.aspect} />
                    <div className="flex-1 text-sm text-slate-200 text-right">
                      Natal {a.p1_name}
                    </div>
                    <div className="text-xs font-mono text-slate-500 w-12 text-right">{a.orbit}°</div>
                    <div className={`text-xs w-16 text-right ${a.aspect_movement === 'Applying' ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {a.aspect_movement}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 overflow-hidden">
            <button onClick={() => setShowChart(!showChart)}
              className="w-full px-5 py-3 text-sm font-medium text-slate-300 hover:text-purple-400 transition-colors flex items-center justify-between">
              <span>Transit Chart Wheel</span>
              <span className="text-slate-500">{showChart ? '▲' : '▼'}</span>
            </button>
            {showChart && (
              <div className="p-4 overflow-auto" dangerouslySetInnerHTML={{ __html: result.svg_chart }} />
            )}
          </div>
        </div>
      )}

      {/* Upcoming transits */}
      {upcoming.length > 0 && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700/50 text-sm font-medium text-slate-300">
            30-Day Forecast <span className="text-slate-500">({upcoming.length} active days)</span>
          </div>
          <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
            {upcoming.map((day) => (
              <div key={day.date} className="px-5 py-3">
                <div className="text-xs text-amber-400/70 mb-2 font-medium">
                  {new Date(day.date + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="flex flex-wrap gap-2">
                  {day.aspects.map((a, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300">
                      <span className="text-slate-500">{a.p2_name}</span>
                      <AspectBadge aspect={a.aspect} />
                      <span className="text-slate-500">{a.p1_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
