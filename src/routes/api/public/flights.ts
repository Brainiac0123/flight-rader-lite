import { createFileRoute } from "@tanstack/react-router";

import { NIGERIA_BOUNDS } from "@/lib/types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

const OPENSKY_URL =
  `https://opensky-network.org/api/states/all` +
  `?lamin=${NIGERIA_BOUNDS.latMin}&lomin=${NIGERIA_BOUNDS.lonMin}` +
  `&lamax=${NIGERIA_BOUNDS.latMax}&lomax=${NIGERIA_BOUNDS.lonMax}`;

/**
 * Same-origin proxy for the OpenSky state-vector endpoint.
 *
 * OpenSky does not send CORS headers, so the browser cannot call it directly.
 * This handler runs server-side (no CORS applies) and re-serves the payload
 * with permissive CORS headers.
 */
export const Route = createFileRoute("/api/public/flights")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      GET: async () => {
        try {
          const upstream = await fetch(OPENSKY_URL, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(20_000),
          });

          if (!upstream.ok) {
            console.error(`OpenSky proxy: upstream responded with ${upstream.status}`);
            return Response.json(
              { error: `OpenSky responded with ${upstream.status}` },
              { status: 502, headers: CORS_HEADERS },
            );
          }

          const data = await upstream.json();
          return Response.json(data, { headers: CORS_HEADERS });
        } catch (error) {
          console.error("OpenSky proxy error:", error);
          return Response.json(
            { error: "Failed to fetch flights from OpenSky" },
            { status: 500, headers: CORS_HEADERS },
          );
        }
      },
    },
  },
});
