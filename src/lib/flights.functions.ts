import { createServerFn } from "@tanstack/react-start";

import { fetchOpenSkyRaw } from "./opensky.server";

/**
 * Server-side relay for the OpenSky state-vector endpoint.
 *
 * The browser talks to OpenSky directly (it sends permissive CORS headers).
 * This relay is only used as a fallback when the direct call is blocked by a
 * network policy or a corporate proxy, so live data never silently disappears.
 */
export const getFlightsRelay = createServerFn({ method: "GET" }).handler(async () => {
  return fetchOpenSkyRaw();
});
