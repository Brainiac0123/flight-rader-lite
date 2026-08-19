import L from "leaflet";
import { Marker, Tooltip } from "react-leaflet";
import { useMemo } from "react";

import type { Flight } from "@/lib/types";

/**
 * Builds a rotated plane glyph as a Leaflet div icon. The glyph points north at
 * 0deg, so the aircraft's true track can be applied directly as a rotation.
 */
function planeIcon(flight: Flight, selected: boolean) {
  const size = selected ? 34 : 28;
  const classes = [
    "plane-marker",
    selected ? "is-selected" : "",
    flight.onGround ? "on-ground" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return L.divIcon({
    className: "!bg-transparent !border-0",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html = `` as never,
  });
}

interface FlightMarkerProps {
  flight: Flight;
  selected: boolean;
  onSelect: (icao24: string) => void;
}

export function FlightMarker({ flight, selected, onSelect }: FlightMarkerProps) {
  const icon = useMemo(() => planeIcon(flight, selected), [flight, selected]);

  return (
    <Marker
      position={[flight.latitude, flight.longitude]}
      icon={icon}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(flight.icao24) }}
    >
      <Tooltip direction="top" offset={[0, -12]} opacity={1}>
        <span className="font-mono text-xs">{flight.callsign}</span>
      </Tooltip>
    </Marker>
  );
}
