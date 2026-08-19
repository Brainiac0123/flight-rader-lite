import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Rectangle, TileLayer, useMap } from "react-leaflet";

import { FlightMarker } from "./FlightMarker";
import { NIGERIA_BOUNDS, NIGERIA_CENTER, type Flight } from "@/lib/types";

/** Nigerian airspace box the map view is constrained to. */
const AIRSPACE: L.LatLngBoundsExpression = [
  [NIGERIA_BOUNDS.latMin, NIGERIA_BOUNDS.lonMin],
  [NIGERIA_BOUNDS.latMax, NIGERIA_BOUNDS.lonMax],
];

/** Recentres the map on the selected aircraft without fighting user panning. */
function FollowSelected({ flight }: { flight: Flight | null }) {
  const map = useMap();

  useEffect(() => {
    if (!flight) return;
    map.panTo([flight.latitude, flight.longitude], { animate: true });
  }, [flight?.icao24, flight?.latitude, flight?.longitude, flight, map]);

  return null;
}

/** Keeps the Leaflet canvas sized correctly through responsive layout shifts. */
function ResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    const timer = window.setTimeout(invalidate, 120);
    window.addEventListener("resize", invalidate);
    window.addEventListener("orientationchange", invalidate);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("orientationchange", invalidate);
    };
  }, [map]);

  return null;
}

interface MapComponentProps {
  flights: Flight[];
  selectedIcao: string | null;
  onSelect: (icao24: string) => void;
}

export default function MapComponent({ flights, selectedIcao, onSelect }: MapComponentProps) {
  const selected = flights.find((flight) => flight.icao24 === selectedIcao) ?? null;

  return (
    <MapContainer
      center={NIGERIA_CENTER}
      zoom={6}
      minZoom={5}
      maxZoom={11}
      maxBounds={AIRSPACE}
      maxBoundsViscosity={0.9}
      className="h-full w-full"
      zoomControl
      attributionControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &middot; ADS-B via OpenSky Network'
      />

      {/* Visual outline of the monitored airspace */}
      <Rectangle
        bounds={AIRSPACE}
        pathOptions={{
          color: "var(--color-primary)",
          weight: 1,
          dashArray: "6 6",
          fillOpacity: 0.02,
        }}
      />

      {flights.map((flight) => (
        <FlightMarker
          key={flight.icao24}
          flight={flight}
          selected={flight.icao24 === selectedIcao}
          onSelect={onSelect}
        />
      ))}

      <FollowSelected flight={selected} />
      <ResizeHandler />
    </MapContainer>
  );
}
