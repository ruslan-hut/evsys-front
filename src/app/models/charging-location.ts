// A site from the backend `locations` collection, keyed by `id` and referenced
// by `location_id` on each charge point. Distinct from the `Location`
// (latitude/longitude) model, which is a charge point's map coordinates.
export interface ChargingLocation {
  id: string,
  name?: string,
  address: string,
  city: string,
  power_limit: number,
  default_power_limit: number,
}
