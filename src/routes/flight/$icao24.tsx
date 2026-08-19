import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Plane } from "lucide-react";

import { StatusBanner, type RadarStatus } from "@/components/StatusBanner";
import { clockFromUnix, fmt } from "@/components/Sidebar";
import { flightsQueryOptions } from "@/lib/flights";
import { demoSnapshot } from "@/lib/normalize";
import { STALE_AFTER_SECONDS, type Flight } from "@/lib/types";

export const Route = createFileRoute("/flight/$icao24")({
  head: ({ params }) => {
    const tag = params.icao24.toUpperCase();
    return {
      meta: [
        { title: `Flight ${tag} — Telemetry | Flight Radar Lite` },
        {
          name: "description",
          content: `Full live telemetry for aircraft ${tag} over Nigeria: altitude, ground speed, heading, vertical rate, squawk and last contact.`,
        },
        { property: "og:title", content: `Flight ${tag} — Telemetry` },
        {
          property: "og:description",
          content: `Live ADS-B telemetry for aircraft ${tag} tracked over Nigerian airspace.`,
        },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: FlightDetailPage,
});

function Field({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-panel-strong/60 px-3 py-2.5">
      <p className="label-caps">{label}</p>
      <p className={`mt-1 break-words text-sm ${mono ? "telemetry-value" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function Telemetry({ flight, snapshotTime }: { flight: Flight; snapshotTime: number }) {
  return (
    <>
      <section className="panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md border border-border bg-panel-strong">
              <Plane
                className="h-5 w-5 text-primary"
                style={{ transform: `rotate(${flight.headingDeg}deg)` }}
                aria-hidden="true"
              />
            </span>
            <div>
              <h1 className="font-mono text-2xl font-semibold text-primary">{flight.callsign}</h1>
              <p className="font-mono text-[11px] text-muted-foreground">
                ICAO24 {flight.icao24.toUpperCase()} · {flight.originCountry}
              </p>
            </div>
          </div>
          <StatusBanner
            status={flight.isDemo ? "demo" : flight.ageSeconds > STALE_AFTER_SECONDS ? "error" : "live"}
            detail={`snapshot ${clockFromUnix(snapshotTime)}`}
          />
        </div>
      </section>

      <section className="panel p-4 sm:p-5">
        <h2 className="label-caps">Primary telemetry</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Barometric altitude" value={fmt(flight.altitudeFt, "ft")} />
          <Field label="Geometric altitude" value={fmt(flight.geoAltitudeFt, "ft")} />
          <Field label="Ground speed" value={fmt(flight.speedKts, "kts")} />
          <Field label="True track" value={fmt(flight.headingDeg, "°", 1)} />
          <Field label="Vertical rate" value={fmt(flight.verticalRateFpm, "fpm")} />
          <Field label="Latitude" value={fmt(flight.latitude, "°N", 4)} />
          <Field label="Longitude" value={fmt(flight.longitude, "°E", 4)} />
          <Field label="Squawk" value={flight.squawk ?? "—"} />
        </div>
      </section>

      <section className="panel p-4 sm:p-5">
        <h2 className="label-caps">Ground state & contact</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="On ground" value={flight.onGround ? "Yes" : "No"} mono={false} />
          <Field label="Special position (SPI)" value={flight.spi ? "Yes" : "No"} mono={false} />
          <Field label="Position source" value={flight.positionSource} mono={false} />
          <Field label="Origin country" value={flight.originCountry} mono={false} />
          <Field label="Last contact" value={clockFromUnix(flight.lastContact)} />
          <Field label="Position time" value={clockFromUnix(flight.timePosition)} />
          <Field label="Data age" value={fmt(flight.ageSeconds, "s")} />
          <Field label="Snapshot time" value={clockFromUnix(snapshotTime)} />
        </div>
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">
          Records older than {STALE_AFTER_SECONDS}s are dropped from the radar as stale.
        </p>
      </section>
    </>
  );
}

function FlightDetailPage() {
  const { icao24 } = Route.useParams();
  const { data, isLoading, isError } = useQuery(flightsQueryOptions);

  const demo = demoSnapshot();
  const snapshot = data && data.flights.length > 0 ? data : isLoading ? null : demo;
  const flight = snapshot?.flights.find((item) => item.icao24 === icao24.toLowerCase()) ?? null;

  const status: RadarStatus = isLoading ? "loading" : isError && !data ? "error" : "empty";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-panel px-3 py-1.5 font-mono text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to radar
          </Link>
          <span className="truncate font-mono text-[11px] text-muted-foreground">
            Flight Radar Lite
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 p-3 sm:gap-4 sm:p-6">
        {flight ? (
          <Telemetry flight={flight} snapshotTime={snapshot?.time ?? flight.lastContact} />
        ) : (
          <section className="panel p-6 text-center">
            <StatusBanner status={status} className="mx-auto w-fit" />
            <h1 className="mt-4 font-mono text-xl font-semibold text-foreground">
              {icao24.toUpperCase()}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLoading
                ? "Acquiring live state vectors…"
                : "This aircraft is no longer transmitting inside the monitored airspace."}
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Return to radar
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
