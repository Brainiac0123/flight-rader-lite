# Flight Radar Lite

Live aircraft tracking over Nigerian airspace. Flight Radar Lite renders real-time ADS-B
positions from the OpenSky Network on an OpenStreetMap basemap and exposes full telemetry
for every tracked aircraft.

**FUTM-SWE-221 · Project 13**

## Features

- Dark aviation radar map centred on Nigeria (9.0820°N, 8.6753°E) and constrained to the
  monitored airspace box (4°–14°N, 2°–15°E).
- Custom plane glyphs rotated to each aircraft's true track.
- Live polling every 10 seconds; the previous snapshot stays on screen while refetching.
- Sidebar with aircraft count, last-updated timestamp, search and a scrollable flight list.
- Status banner for `Live`, `No flights`, `Demo feed` and `Feed error` states.
- Demo aircraft fallback (`DEMO123`, 35,000 ft, 480 kts, 9.08°N / 8.68°E) when the feed is
  empty, so the radar is never blank.
- Dedicated detail route `/flight/:icao24` with the complete OpenSky state vector:
  barometric and geometric altitude, ground speed, true track, vertical rate, squawk,
  ground state, SPI, position source, last contact and data age.
- Fully responsive: stacked map + list on mobile, split radar/telemetry layout on desktop.

## Data pipeline

1. Request the Nigerian bounding box through the Vercel serverless function at
  `/api/flights`. The function adds CORS headers and fetches OpenSky server-side.
2. If the serverless function fails or returns no states, request the same bounds through
  the allorigins CORS proxy.
3. Normalize each positional state vector into a typed object
   (`src/lib/normalize.ts`), converting metres → feet (×3.28084),
   m/s → knots (×1.94384) and m/s → ft/min (×196.85).
4. Drop records without a valid position, records outside the airspace box, and records
   whose `last_contact` is older than 60 seconds (stale data).
5. Sort by callsign and render markers; on request failure the last good snapshot remains
  visible, and if both live sources fail the demo aircraft is shown.

## Tech stack

| Layer      | Choice                                    |
| ---------- | ----------------------------------------- |
| Framework  | React 19 + TanStack Start                 |
| Routing    | TanStack Router (file-based)              |
| Data       | TanStack Query (`refetchInterval: 10000`)  |
| Map        | Leaflet + react-leaflet + OpenStreetMap   |
| Styling    | Tailwind CSS v4 design tokens             |
| Language   | TypeScript                                |

## Project structure

```
src/
  routes/
    __root.tsx            # document shell, fonts, global metadata
    index.tsx             # radar map + sidebar
    flight/$icao24.tsx    # full telemetry detail page
  components/
    MapComponent.tsx      # Leaflet map, airspace box, markers
    FlightMarker.tsx      # rotated plane glyph marker
    Sidebar.tsx           # counts, selected telemetry, flight list
    StatusBanner.tsx      # feed status indicator
  lib/
    types.ts              # OpenSky + normalized flight types, airspace bounds
    normalize.ts          # state-vector normalizer, unit conversion, demo data
    flights.ts            # client fetch + TanStack Query options
    flights.functions.ts  # optional TanStack server relay
  styles.css              # dark aviation design tokens
```

## Getting started

```bash
npm install
npm run dev      # http://localhost:8080
npm run build
npm run preview
```

## SDLC notes

- **Planning** — scope bounded to Nigerian airspace to keep payloads small and relevant.
- **Analysis** — target persona: an aviation student inspecting live traffic and telemetry.
- **Design** — dark radar canvas with a persistent detail panel and monospace telemetry.
- **Implementation** — 10-second polling loop with incremental marker updates.
- **Testing** — verified staleness filtering, empty feed, and request-failure fallbacks.
- **Deployment** — web application served as a single build artifact.

## Attribution

Flight data © [OpenSky Network](https://opensky-network.org/).
Basemap © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
