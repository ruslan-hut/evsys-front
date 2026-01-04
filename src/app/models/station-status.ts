export interface StationStatus {
  charge_point_id: string;
  state: string;
  since: string;
  duration_seconds: number;
  last_event_text: string;
}
