/**
 * The site concurrency report, from GET /report/concurrency.
 *
 * A location's load is the sum of what its charge points draw at the same
 * moment, so the report is built from segments: the longest stretches over
 * which the set of charging sessions did not change.
 *
 * Two peaks are reported and they answer different questions.
 * `peak_assigned_amps` is the sum of the limits the load balancer handed out -
 * what the site was permitted to draw. `peak_power_watts` is measured from the
 * meter values the chargers reported - what it did draw. They are in different
 * units on purpose and are not comparable as numbers; what they compare is
 * whether the permitted total was ever approached.
 */

/** One session inside a segment. */
export interface SegmentSession {
  transaction_id: number,
  charge_point_id: string,
  connector_id: number,
  /** Amperage the load balancer assigned. Zero means none was recorded. */
  power_limit: number,
}

/** A stretch of time over which the set of charging sessions did not change. */
export interface ConcurrencySegment {
  from: string,
  to: string,
  seconds: number,
  sessions: number,
  /** Sum of the assigned limits over the segment's sessions, in amps. */
  assigned_amps: number,
  detail: SegmentSession[],
}

/** How long the location spent with exactly this many sessions charging. */
export interface ConcurrencyLevel {
  sessions: number,
  seconds: number,
}

export interface SiteConcurrency {
  location_id: string,
  location_name?: string,
  from: string,
  to: string,

  /** Sessions overlapping the window, including those spanning its edges. */
  sessions: number,
  max_sessions: number,
  /** Time with at least two sessions charging. */
  overlap_seconds: number,

  /** Highest sum of assigned limits: permitted, not measured. */
  peak_assigned_amps: number,
  peak_assigned_at?: string,

  /**
   * Highest concurrent draw measured from meter values, resolved to the minute.
   * Zero when no session in the window reported power, which is not the same as
   * an idle site: a charger that sends no MeterValues is invisible here while
   * still drawing.
   */
  peak_power_watts: number,
  peak_power_at?: string,
  peak_power_sessions: number,

  levels: ConcurrencyLevel[],
  /** Filtered by the requested minimum session count, in time order. */
  segments: ConcurrencySegment[],
  /** Set when the segment list was capped; the summary fields stay exact. */
  truncated?: boolean,
}
