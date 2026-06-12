const COLORS: Record<string, string> = {
  conjunction:    'bg-amber-500/20 text-amber-300 border-amber-500/30',
  opposition:     'bg-red-500/20 text-red-300 border-red-500/30',
  square:         'bg-orange-500/20 text-orange-300 border-orange-500/30',
  trine:          'bg-purple-500/20 text-purple-300 border-purple-500/30',
  sextile:        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  quincunx:       'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'semi-sextile': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'semi-square':  'bg-rose-500/20 text-rose-300 border-rose-500/30',
  quintile:       'bg-violet-500/20 text-violet-300 border-violet-500/30',
};

const SYMBOLS: Record<string, string> = {
  conjunction: '☌', opposition: '☍', square: '□',
  trine: '△', sextile: '⚹', quincunx: '⚻',
  'semi-sextile': '⚺', 'semi-square': '∠', quintile: 'Q',
};

export default function AspectBadge({ aspect }: { aspect: string }) {
  const cls = COLORS[aspect.toLowerCase()] ?? 'bg-slate-700/40 text-slate-400 border-slate-600/30';
  const sym = SYMBOLS[aspect.toLowerCase()] ?? '·';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cls}`}>
      <span>{sym}</span>
      <span className="capitalize">{aspect}</span>
    </span>
  );
}
