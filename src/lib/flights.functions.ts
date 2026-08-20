import { createServerFn } from "@tanstack/react-start";

import { fetchOpenSkyRaw } from "./opensky.server";

/**
 * Server-side relay for the OpenSky state-vector endpoint.
 *
 * This relay is retained for server-side consumers of the TanStack Start app.
 * The browser-facing fetch order uses the Vercel function and allorigins proxy
 * so it never calls OpenSky directly.
 */
export const getFlightsRelay = createServerFn({ method: "GET" }).handler(async () => {
  return fetchOpenSkyRaw();
});
