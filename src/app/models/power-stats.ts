/**
 * How power report rows are aggregated.
 *
 * 'charger' and 'session' describe individual charging sessions; 'hour' and
 * 'day' describe fleet output over time.
 */
export type PowerGroupBy = 'charger' | 'session' | 'hour' | 'day';

/**
 * One row of the power report, as returned by GET /report/power.
 *
 * Power is in watts and energy in watt-hours, like the rest of the API.
 * Which identifying fields are present depends on the grouping.
 */
export interface PowerStats {
  charge_point_id?: string;
  transaction_id?: number;
  date?: string;
  hour?: number;

  /**
   * Sessions in the group. For 'hour' and 'day' a session spanning several
   * buckets is counted in each one, so this column does not sum to a total.
   */
  sessions: number;

  /** Energy in watt-hours. */
  total_consumed: number;

  /**
   * Elapsed session time for 'charger' and 'session'; seconds the fleet spent
   * charging for 'hour' and 'day'.
   */
  duration_seconds: number;

  /** Mean power over samples that were actually drawing, in watts. */
  avg_charging_power: number;

  /**
   * Energy over elapsed session time, in watts. Includes idle time, so it sits
   * below avg_charging_power. Zero for the 'hour' and 'day' groupings.
   */
  avg_session_power: number;

  /**
   * Peak power in watts. For 'charger' and 'session' this is the highest single
   * sample; for 'hour' and 'day' it is the highest concurrent draw across all
   * sessions. The two are not comparable.
   */
  max_power: number;

  /** Meter values behind the power figures; they mean nothing when this is 0. */
  samples: number;
}
