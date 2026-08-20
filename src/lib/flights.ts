/**
 * Client data access for the radar.
 *
 * OpenSky's CORS policy only allows its own origin, so the snapshot is fetched
 * through a thin same-origin relay. If the relay is unavailable the browser
 * falls back to calling OpenSky directly, which succeeds in environments where
 * cross-origin access is permitted.
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
    payload = (await getFlightsRelay()) as OpenSkyResponse;
  } catch {
    payload = await fetchDirect();
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
