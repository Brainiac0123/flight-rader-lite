/**
 * Converts raw OpenSky state vectors into normalized, typed flight objects.
 *
 * Unit conversions:
 *   metres        -> feet            (x 3.28084)
 *   metres/second -> knots           (x 1.94384)
 *   metres/second -> feet per minute (x 196.850)
 */

import {
  NIGERIA_BOUNDS,
  STALE_AFTER_SECONDS,
  type Flight,
  type FlightsSnapshot,
  type OpenSkyResponse,
  type OpenSkyStateVector,
} from "./types";

const M_TO_FT = 3.28084;
const MS_TO_KTS = 1.94384;
const MS_TO_FPM = 196.8504;

const POSITION_SOURCES = ["ADS-B", "ASTERIX", "MLAT", "FLARM"];

const round = (value: number, digits = 0) => {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
};

export function isWithinNigeria(lat: number, lon: number): boolean {
  return (
    lat >= NIGERIA_BOUNDS.latMin &&
    lat <= NIGERIA_BOUNDS.latMax &&
    lon >= NIGERIA_BOUNDS.lonMin &&
    lon <= NIGERIA_BOUNDS.lonMax
  );
}

export function normalizeState(state: OpenSkyStateVector, snapshotTime: number): Flight | null {
  const [
    icao24,
    callsign,
    originCountry,
    timePosition,
    lastContact,
    longitude,
    latitude,
    baroAltitude,
    onGround,
    velocity,
    trueTrack,
    verticalRate,
    ,
    geoAltitude,
    squawk,
    spi,
    positionSource,
  ] = state;

  // Discard records without a usable position.
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  if (!isWithinNigeria(latitude, longitude)) return null;

  const contact = typeof lastContact === "number" ? lastContact : snapshotTime;
  const ageSeconds = Math.max(0, snapshotTime - contact);

  return {
    icao24: (icao24 ?? "").trim().toLowerCase(),
    callsign: (callsign ?? "").trim() || "N/A",
    originCountry: (originCountry ?? "Unknown").trim(),
    timePosition: timePosition ?? null,
    lastContact: contact,
    ageSeconds,
    longitude: round(longitude, 4),
    latitude: round(latitude, 4),
    altitudeFt: typeof baroAltitude === "number" ? round(baroAltitude * M_TO_FT) : null,
    geoAltitudeFt: typeof geoAltitude === "number" ? round(geoAltitude * M_TO_FT) : null,
    onGround: Boolean(onGround),
    speedKts: typeof velocity === "number" ? round(velocity * MS_TO_KTS) : null,
    headingDeg: typeof trueTrack === "number" ? round(trueTrack, 1) : 0,
    verticalRateFpm: typeof verticalRate === "number" ? round(verticalRate * MS_TO_FPM) : null,
    squawk: squawk ?? null,
    spi: Boolean(spi),
    positionSource:
      typeof positionSource === "number" ? (POSITION_SOURCES[positionSource] ?? "Unknown") : "Unknown",
  };
}

/** Full pipeline: parse -> bound filter -> staleness filter -> sort. */
export function normalizeResponse(payload: OpenSkyResponse): FlightsSnapshot {
  const snapshotTime = payload.time || Math.floor(Date.now() / 1000);
  const flights = (payload.states ?? [])
    .map((state) => normalizeState(state, snapshotTime))
    .filter((flight): flight is Flight => flight !== null)
    .filter((flight) => flight.ageSeconds <= STALE_AFTER_SECONDS)
    .sort((a, b) => a.callsign.localeCompare(b.callsign));

  return { time: snapshotTime, flights, isDemo: false };
}

/** Offline/empty-state aircraft so the radar always has something to show. */
export function demoSnapshot(): FlightsSnapshot {
  const now = Math.floor(Date.now() / 1000);
  return {
    time: now,
    isDemo: true,
    flights: [
      {
        icao24: "demo01",
        callsign: "DEMO123",
        originCountry: "Nigeria",
        timePosition: now,
        lastContact: now,
        ageSeconds: 0,
        longitude: 8.68,
        latitude: 9.08,
        altitudeFt: 35000,
        geoAltitudeFt: 35150,
        onGround: false,
        speedKts: 480,
        headingDeg: 78,
        verticalRateFpm: 0,
        squawk: "2000",
        spi: false,
        positionSource: "ADS-B",
        isDemo: true,
      },
    ],
  };
}
