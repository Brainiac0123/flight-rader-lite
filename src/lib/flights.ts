/**
 * Client data access for the radar.
 *
 * OpenSky sends no CORS headers, so the browser can never call it directly.
 * Resolution order:
 *   A. Vercel serverless function -> /api/flights
 *   C. public CORS proxy          -> allorigins.win
 *   D. demo flight
 */

import { queryOptions } from "@tanstack/react-query";

import { demoSnapshot, normalizeResponse } from "./normalize";
import { NIGERIA_BOUNDS, type FlightsSnapshot, type OpenSkyResponse } from "./types";

const OPENSKY_URL =
  `https://opensky-network.org/api/states/all` +
  `?lamin=${NIGERIA_BOUNDS.latMin}&lomin=${NIGERIA_BOUNDS.lonMin}` +
  `&lamax=${NIGERIA_BOUNDS.latMax}&lomax=${NIGERIA_BOUNDS.lonMax}`;

const PROXY_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(OPENSKY_URL)}`;

const isUsable = (payload: unknown): payload is OpenSkyResponse => {
  if (!payload || typeof payload !== "object" || !("states" in payload)) return false;
  const states = (payload as { states?: unknown }).states;
  return Array.isArray(states) && states.length > 0;
};

async function fetchJson(url: string, timeoutMs = 15_000): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`${url} responded with ${response.status}`);
  return await response.json();
}

/** Option A: Vercel serverless function. */
async function fetchViaServerlessProxy(): Promise<OpenSkyResponse | null> {
  try {
    console.info("[flights] Trying Option A: Vercel serverless function");
    const data = await fetchJson("/api/flights");
    if (isUsable(data)) {
      console.info("[flights] Option A succeeded");
      return data;
    }
    console.warn("[flights] Option A returned no flights");
  } catch (error) {
    console.warn("[flights] Option A failed, trying Option C (CORS proxy):", error);
  }
  return null;
}

/** Option C: public CORS proxy. */
async function fetchViaCorsProxy(): Promise<OpenSkyResponse | null> {
  try {
    console.info("[flights] Trying Option C: allorigins CORS proxy");
    const data = await fetchJson(PROXY_URL, 20_000);
    if (isUsable(data)) {
      console.info("[flights] Option C succeeded");
      return data;
    }
    console.warn("[flights] Option C returned no flights");
  } catch (error) {
    console.warn("[flights] Option C failed too:", error);
  }
  return null;
}

export async function fetchFlights(): Promise<FlightsSnapshot> {
  const payload = (await fetchViaServerlessProxy()) ?? (await fetchViaCorsProxy());

  if (!payload) {
    console.warn("[flights] Options A and C failed — showing demo flight");
    return demoSnapshot();
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
