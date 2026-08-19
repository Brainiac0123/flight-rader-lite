import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Radar } from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";

import { Sidebar } from "@/components/Sidebar";
import { StatusBanner, type RadarStatus } from "@/components/StatusBanner";
import { flightsQueryOptions } from "@/lib/flights";
import { demoSnapshot } from "@/lib/normalize";

// Leaflet touches `window` at import time, so the map module is only ever
// loaded in the browser, behind <ClientOnly>.
const MapComponent = lazy(() => import("@/components/MapComponent"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flight Radar Lite — Live Flights Over Nigeria" },
      {
        name: "description",
        content:
          "Track live aircraft over Nigerian airspace on a dark radar map. Tap any plane for callsign, altitude, speed and heading from ADS-B data.",
      },
      { property: "og:title", content: "Flight Radar Lite — Live Flights Over Nigeria" },
      {
        property: "og:description",
        content:
          "Live ADS-B aircraft positions over Nigeria with altitude, speed and heading telemetry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RadarPage,
});

function MapSkeleton() {
  return (
    <div className="radar-grid flex h-full w-full items-center justify-center bg-panel">
      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <Radar className="h-4 w-4 scan-pulse text-primary" aria-hidden="true" />
        Initialising radar…
      </div>
    </div>
  );
}

function RadarPage() {
  const [selectedIcao, setSelectedIcao] = useState<string | null>(null);
  const { data, isError, isLoading, dataUpdatedAt } = useQuery(flightsQueryOptions);

  // Demo fallback: if the live feed returns nothing, keep one aircraft on
  // screen so the radar never renders as a dead map.
  const snapshot = useMemo(() => {
    if (data && data.flights.length > 0) return data;
    if (isLoading) return null;
    return demoSnapshot();
  }, [data, isLoading]);

  const flights = snapshot?.flights ?? [];

  const status: RadarStatus = isLoading
    ? "loading"
    : isError && !data
      ? "error"
      : snapshot?.isDemo
        ? "demo"
        : flights.length === 0
          ? "empty"
          : "live";

  // Drop a selection that has left the airspace.
  useEffect(() => {
    if (selectedIcao && !flights.some((flight) => flight.icao24 === selectedIcao)) {
      setSelectedIcao(null);
    }
  }, [flights, selectedIcao]);

  const selected = flights.find((flight) => flight.icao24 === selectedIcao) ?? null;
  const updatedAt = snapshot?.time ?? (dataUpdatedAt ? Math.floor(dataUpdatedAt / 1000) : null);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-panel">
              <Radar className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
                Flight Radar Lite
              </h1>
              <p className="truncate font-mono text-[10px] text-muted-foreground sm:text-[11px]">
                Nigerian airspace · 4°–14°N / 2°–15°E
              </p>
            </div>
          </div>
          <StatusBanner status={status} className="shrink-0" />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 gap-3 p-3 sm:gap-4 sm:p-4 lg:h-[calc(100vh-65px)] lg:grid-cols-[minmax(0,1fr)_380px] lg:overflow-hidden">
        <section className="relative h-[52vh] min-h-[320px] overflow-hidden rounded-lg border border-border lg:h-auto">
          <ClientOnly fallback={<MapSkeleton />}>
            <Suspense fallback={<MapSkeleton />}>
              <MapComponent
                flights={flights}
                selectedIcao={selectedIcao}
                onSelect={setSelectedIcao}
              />
            </Suspense>
          </ClientOnly>
        </section>

        <Sidebar
          flights={flights}
          selected={selected}
          selectedIcao={selectedIcao}
          onSelect={setSelectedIcao}
          status={status}
          updatedAt={updatedAt}
        />
      </main>

      <footer className="border-t border-border px-4 py-3 text-center font-mono text-[10px] text-muted-foreground sm:px-6">
        Data: OpenSky Network · Basemap: OpenStreetMap · FUTM-SWE-221 Project 13
      </footer>
    </div>
  );
}
