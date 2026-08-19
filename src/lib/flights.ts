/**
 * Client data access for the radar.
 *
 * Strategy: call OpenSky straight from the browser (frontend-only by design).
 * If that request fails for network/CORS reasons, retry once through the
 * server relay so the radar stays live.
 */

import { queryOptions } from "@tanstack/react-query";

import { getFlightsRelay } from "./flights.functions";
import { normalizeResponse } from "./normalize";
import { NIGERIA_BOUNDS, type FlightsSnapshot, type OpenSkyResponse } from "./types";

const DIRECT_URL =
  `https://opensky-network.org/api/states/all` +
  `?lamin=${NIGERIA_BOUNDS.latMin}&lomin=${NIGERIA_BOUNDS.lonMin}` +
  `&lamax=${NIGERIA_BOUNDS.latMax}&lomax=${NIGERIA_BOUNDS.lonMax}`;

async function fetchDirect(): Promise<OpenSkyResponse> {
  const response = await fetch(DIRECT_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`OpenSky responded with ${response.status}`);
  return (await response.json()) as OpenSkyResponse;
}

export async function fetchFlights(): Promise<FlightsSnapshot> {
  let payload: OpenSkyResponse;
  try {
    payload = await fetchDirect();
  } catch {
    payload = (await getFlightsRelay()) as OpenSkyResponse;
  }
  return normalizeResponse(payload);
}

export const flightsQueryOptions = queryOptions({
  queryKey: ["flights", "nigeria"],
  queryFn: fetchFlights,
  refetchInterval: 10_000,
  refetchOnWindowFocus: true,
  staleTime: 5_000,
  retry: 1,
  // Keep the previous snapshot on screen while a refetch is in flight.
  placeholderData: (previous: FlightsSnapshot | undefined) => previous,
});
