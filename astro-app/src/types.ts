export interface BirthData {
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  lng: number;
  lat: number;
  tz_str: string;
}

export interface Aspect {
  p1_name: string;
  p2_name: string;
  p1_owner?: string;
  p2_owner?: string;
  aspect: string;
  orbit: number;
  aspect_movement: string;
  color?: string;
}

export interface SynastryResponse {
  score_value: number;
  score_description: string;
  is_destiny_sign: boolean;
  aspects: Aspect[];
  svg_chart: string;
}

export interface TransitResponse {
  aspects: Aspect[];
  svg_chart: string;
  as_of: string;
}

export interface UpcomingDay {
  date: string;
  aspects: Aspect[];
}

export interface UpcomingResponse {
  upcoming: UpcomingDay[];
  days_checked: number;
}
