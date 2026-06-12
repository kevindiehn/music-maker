import type { BirthData, SynastryResponse, TransitResponse, UpcomingResponse } from './types';

const BASE = '/api';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }
  return res.json();
}

export const api = {
  synastry: (person1: BirthData, person2: BirthData) =>
    post<SynastryResponse>('/synastry', { person1, person2 }),

  transits: (person: BirthData, observer_lng: number, observer_lat: number, observer_tz: string) =>
    post<TransitResponse>('/transits', { person, observer_lng, observer_lat, observer_tz }),

  upcomingTransits: (person: BirthData, observer_lng: number, observer_lat: number, observer_tz: string, days = 30) =>
    post<UpcomingResponse>('/transits/upcoming', { person, observer_lng, observer_lat, observer_tz, days }),
};
