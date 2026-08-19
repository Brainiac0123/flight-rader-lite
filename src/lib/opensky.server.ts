import { NIGERIA_BOUNDS, type OpenSkyResponse } from "./types";

export const OPENSKY_URL =
  `https://opensky-network.org/api/states/all` +
  `?lamin=${NIGERIA_BOUNDS.latMin}&lomin=${NIGERIA_BOUNDS.lonMin}` +
  `&lamax=${NIGERIA_BOUNDS.latMax}&lomax=${NIGERIA_BOUNDS.lonMax}`;

/** Fetches the Nigerian-airspace snapshot from OpenSky (server side). */
export async function fetchOpenSkyRaw(): Promise<OpenSkyResponse> {
  const response = await fetch(OPENSKY_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`OpenSky responded with ${response.status}`);
  }

  return (await response.json()) as OpenSkyResponse;
}
