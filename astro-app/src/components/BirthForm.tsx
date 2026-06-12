import { useState } from 'react';
import type { BirthData } from '../types';

interface Props {
  label: string;
  value: Partial<BirthData>;
  onChange: (data: BirthData) => void;
}

const TZ_OPTIONS = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Sao_Paulo', 'Europe/London',
  'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Tokyo',
  'Asia/Shanghai', 'Australia/Sydney', 'Pacific/Auckland',
];

export default function BirthForm({ label, value, onChange }: Props) {
  const [useGeo, setUseGeo] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const now = new Date();
  const d: BirthData = {
    name: value.name ?? '',
    year: value.year ?? now.getFullYear() - 30,
    month: value.month ?? 1,
    day: value.day ?? 1,
    hour: value.hour ?? 12,
    minute: value.minute ?? 0,
    lng: value.lng ?? 0,
    lat: value.lat ?? 0,
    tz_str: value.tz_str ?? 'UTC',
  };

  function set<K extends keyof BirthData>(key: K, val: BirthData[K]) {
    onChange({ ...d, [key]: val });
  }

  function detectLocation() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    setUseGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        onChange({ ...d, lng: pos.coords.longitude, lat: pos.coords.latitude, tz_str: tz });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
    );
  }

  const input = 'w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20';

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 space-y-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-amber-400/70">{label}</div>

      <input
        className={input}
        placeholder="Name"
        value={d.name}
        onChange={(e) => set('name', e.target.value)}
      />

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Year</label>
          <input type="number" className={input} value={d.year} min={1900} max={2100}
            onChange={(e) => set('year', +e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Month</label>
          <input type="number" className={input} value={d.month} min={1} max={12}
            onChange={(e) => set('month', +e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Day</label>
          <input type="number" className={input} value={d.day} min={1} max={31}
            onChange={(e) => set('day', +e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Hour (0–23)</label>
          <input type="number" className={input} value={d.hour} min={0} max={23}
            onChange={(e) => set('hour', +e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Minute</label>
          <input type="number" className={input} value={d.minute} min={0} max={59}
            onChange={(e) => set('minute', +e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Latitude</label>
          <input type="number" step="0.0001" className={input} value={d.lat}
            onChange={(e) => set('lat', +e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Longitude</label>
          <input type="number" step="0.0001" className={input} value={d.lng}
            onChange={(e) => set('lng', +e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-500 mb-1 block">Timezone</label>
        <select className={input} value={d.tz_str} onChange={(e) => set('tz_str', e.target.value)}>
          {TZ_OPTIONS.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>

      <button
        type="button"
        onClick={detectLocation}
        className="w-full text-xs text-slate-400 hover:text-amber-400 transition-colors py-1 flex items-center justify-center gap-1.5"
      >
        <span>{geoLoading ? '⟳' : '◎'}</span>
        {useGeo && !geoLoading ? 'Location detected' : 'Use my current location'}
      </button>
    </div>
  );
}
