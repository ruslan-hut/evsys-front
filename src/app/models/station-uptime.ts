export interface StationUptime {
  charge_point_id: string;
  online_seconds: number;
  offline_seconds: number;
  online_minutes: number;
  offline_minutes: number;
  uptime_percent: number;
  final_state: string;
}
