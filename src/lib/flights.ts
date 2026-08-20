/**
 * Client data access for the radar.
 *
 * OpenSky sends no CORS headers, so the browser can never call it directly.
 * Resolution order:
 *   A. same-origin serverless proxy  -> /api/public/flights
 *   B. server function relay          -> getFlightsRelay()
 *   C. public CORS proxy              -> allorigins.win
 *   D. demo flight (handled by the UI when the snapshot is empty)
 */

import { queryOptions } from "@tanstack/react-query";

import { getFlightsRelay } from "./flights.functions";
import { normalizeResponse } from "./normalize";
import { NIGERIA_BOUNDS, type FlightsSnapshot, type OpenSkyResponse } from "./types";

const OPENSKY_URL =
  `https://opensky-network.org/api/states/all` +
  `?lamin=${NIGERIA_BOUNDS.latMin}&lomin=${NIGERIA_BOUNDS.lonMin}` +
  `&lamax=${NIGERIA_BOUNDS.latMax}&lomax=${NIGERIA_BOUNDS.lonMax}`;

const PROXY_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(OPENSKY_URL)}`;

const isUsable = (payload: unknown): payload is OpenSkyResponse =>
  Boolean(payload) && typeof payload === "object" && "states" in (payload as object);

async function fetchJson(url: string, timeoutMs = 15_000): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`${url} responded with ${response.status}`);
  return await response.json();
}

/** Option A: same-origin serverless proxy. */
async function fetchViaServerlessProxy(): Promise<OpenSkyResponse | null> {
  try {
    const data = await fetchJson("/api/public/flights");
    if (isUsable(data)) {
      console.info("[flights] Option A: serverless proxy /api/public/flights");
      return data;
    }
  } catch (error) {
    console.warn("[flights] Option A (serverless proxy) failed:", error);
  }
  return null;
}

/** Option B: TanStack server-function relay (same origin, RPC). */
async function fetchViaServerFn(): Promise<OpenSkyResponse | null> {
  try {
    const data = (await getFlightsRelay()) as unknown;
    if (isUsable(data)) {
      console.info("[flights] Option B: server function relay");
      return data;
    }
  } catch (error) {
    console.warn("[flights] Option B (server function relay) failed:", error);
  }
  return null;
}

/** Option C: public CORS proxy. */
async function fetchViaCorsProxy(): Promise<OpenSkyResponse | null> {
  try {
    const data = await fetchJson(PROXY_URL, 20_000);
    if (isUsable(data)) {
      console.info("[flights] Option C: public CORS proxy (allorigins)");
      return data;
    }
  } catch (error) {
    console.warn("[flights] Option C (CORS proxy) failed:", error);
  }
  return null;
}

export async function fetchFlights(): Promise<FlightsSnapshot> {
  const payload =
    (await fetchViaServerlessProxy()) ??
    (await fetchViaServerFn()) ??
    (await fetchViaCorsProxy());

  if (!payload) {
    console.warn("[flights] All sources failed — falling back to demo flight");
    return { time: Math.floor(Date.now() / 1000), flights: [], isDemo: false };
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
