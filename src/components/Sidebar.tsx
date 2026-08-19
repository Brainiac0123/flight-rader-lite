import { Link } from "@tanstack/react-router";
import { ChevronRight, Plane, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { StatusBanner, type RadarStatus } from "./StatusBanner";
import type { Flight } from "@/lib/types";

export const fmt = (value: number | null | undefined, unit = "", digits = 0) =>
  value === null || value === undefined || Number.isNaN(value)
    ? "—"
    : `${value.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })}${unit ? ` ${unit}` : ""}`;

export const clockFromUnix = (seconds: number | null) =>
  seconds ? new Date(seconds * 1000).toLocaleTimeString([], { hour12: false }) : "—";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-panel-strong/60 px-3 py-2">
      <p className="label-caps">{label}</p>
      <p className="telemetry-value mt-1 text-sm">{value}</p>
    </div>
  );
}

interface SidebarProps {
  flights: Flight[];
  selected: Flight | null;
  selectedIcao: string | null;
  onSelect: (icao24: string) => void;
  status: RadarStatus;
  updatedAt: number | null;
}

export function Sidebar({
  flights,
  selected,
  selectedIcao,
  onSelect,
  status,
  updatedAt,
}: SidebarProps) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flights;
    return flights.filter(
      (flight) =>
        flight.callsign.toLowerCase().includes(q) ||
        flight.icao24.includes(q) ||
        flight.originCountry.toLowerCase().includes(q),
    );
  }, [flights, query]);

  return (
    <aside className="flex h-full min-h-0 flex-col gap-3 lg:overflow-hidden">
      {/* Snapshot summary */}
      <section className="panel shrink-0 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label-caps">Aircraft in airspace</p>
            <p className="telemetry-value text-3xl leading-none">{flights.length}</p>
          </div>
          <StatusBanner status={status} />
        </div>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          Last updated {clockFromUnix(updatedAt)} · refresh 10s
        </p>
      </section>

      {/* Selected aircraft telemetry */}
      {selected ? (
        <section className="panel shrink-0 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="label-caps">Selected flight</p>
              <p className="truncate font-mono text-lg font-semibold text-primary">
                {selected.callsign}
              </p>
            </div>
            <Link
              to="/flight/$icao24"
              params={{ icao24: selected.icao24 }}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-panel-strong px-2.5 py-1.5 font-mono text-[11px] text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Details
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric label="Altitude" value={fmt(selected.altitudeFt, "ft")} />
            <Metric label="Speed" value={fmt(selected.speedKts, "kts")} />
            <Metric label="Heading" value={fmt(selected.headingDeg, "°", 1)} />
            <Metric label="Vertical rate" value={fmt(selected.verticalRateFpm, "fpm")} />
            <Metric label="Latitude" value={fmt(selected.latitude, "°N", 4)} />
            <Metric label="Longitude" value={fmt(selected.longitude, "°E", 4)} />
          </div>

          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
            {selected.originCountry} · ICAO24 {selected.icao24.toUpperCase()} ·{" "}
            {selected.onGround ? "On ground" : "Airborne"}
          </p>
        </section>
      ) : (
        <section className="panel shrink-0 p-4">
          <p className="label-caps">Selected flight</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tap a plane on the radar to read its live telemetry.
          </p>
        </section>
      )}

      {/* Active flight list */}
      <section className="panel flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search callsign, ICAO24, country"
            aria-label="Search flights"
            className="w-full bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto max-lg:max-h-80">
          {visible.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matching aircraft.
            </li>
          ) : (
            visible.map((flight) => {
              const active = flight.icao24 === selectedIcao;
              return (
                <li key={flight.icao24}>
                  <button
                    type="button"
                    onClick={() => onSelect(flight.icao24)}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-panel-strong ${
                      active ? "bg-panel-strong" : ""
                    }`}
                  >
                    <Plane
                      className={`h-4 w-4 shrink-0 ${active ? "text-secondary" : "text-primary"}`}
                      style={{ transform: `rotate(${flight.headingDeg}deg)` }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-sm text-foreground">
                        {flight.callsign}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {flight.originCountry}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="telemetry-value block text-xs">
                        {fmt(flight.altitudeFt, "ft")}
                      </span>
                      <span className="telemetry-value block text-[11px] opacity-80">
                        {fmt(flight.speedKts, "kts")}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </aside>
  );
}
