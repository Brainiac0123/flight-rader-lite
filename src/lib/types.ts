/**
 * Flight Radar Lite — domain types
 *
 * OpenSky Network returns "state vectors" as positional arrays. These types
 * describe both the raw wire format and the normalized objects used by the UI.
 */

/** Raw OpenSky state vector (see https://openskynetwork.github.io/opensky-api/rest.html) */
export type OpenSkyStateVector = [
  string, // 0  icao24
  string | null, // 1  callsign
  string | null, // 2  origin_country
  number | null, // 3  time_position (unix s)
  number | null, // 4  last_contact (unix s)
  number | null, // 5  longitude
  number | null, // 6  latitude
  number | null, // 7  baro_altitude (m)
  boolean | null, // 8  on_ground
  number | null, // 9  velocity (m/s)
  number | null, // 10 true_track (deg)
  number | null, // 11 vertical_rate (m/s)
  number[] | null, // 12 sensors
  number | null, // 13 geo_altitude (m)
  string | null, // 14 squawk
  boolean | null, // 15 spi
  number | null, // 16 position_source
];

export interface OpenSkyResponse {
  time: number;
  states: OpenSkyStateVector[] | null;
}

/** Normalized, UI-friendly flight record (imperial units for aviation display). */
export interface Flight {
  icao24: string;
  callsign: string;
  originCountry: string;
  timePosition: number | null;
  lastContact: number;
  /** seconds since last contact, relative to the snapshot time */
  ageSeconds: number;
  longitude: number;
  latitude: number;
  /** barometric altitude, feet */
  altitudeFt: number | null;
  /** geometric altitude, feet */
  geoAltitudeFt: number | null;
  onGround: boolean;
  /** ground speed, knots */
  speedKts: number | null;
  /** true track, degrees clockwise from north */
  headingDeg: number;
  /** vertical rate, feet per minute */
  verticalRateFpm: number | null;
  squawk: string | null;
  spi: boolean;
  positionSource: string;
  isDemo?: boolean;
}

export interface FlightsSnapshot {
  /** snapshot time (unix seconds) reported by the data source */
  time: number;
  flights: Flight[];
  /** true when the payload is the offline demo aircraft */
  isDemo: boolean;
}

/** Nigerian airspace bounding box used for both the request and local filtering. */
export const NIGERIA_BOUNDS = {
  latMin: 4,
  latMax: 14,
  lonMin: 2,
  lonMax: 15,
} as const;

export const NIGERIA_CENTER: [number, number] = [9.082, 8.6753];

/** Flights whose last contact is older than this are considered stale. */
export const STALE_AFTER_SECONDS = 60;
