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

  const html = `<div class="${classes}" style="width:${size}px;height:${size}px;transform:rotate(${flight.headingDeg}deg)">
    <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
      <path d="M12 2c.7 0 1.2.9 1.2 2v5.1l7.6 4.2c.3.2.5.5.5.9v1.2c0 .3-.3.6-.7.5l-7.4-2.2v3.7l2.5 1.9c.2.2.3.4.3.7v1c0 .3-.3.5-.6.4L12 20.4l-3.4 1.1c-.3.1-.6-.1-.6-.4v-1c0-.3.1-.5.3-.7l2.5-1.9v-3.7l-7.4 2.2c-.4.1-.7-.2-.7-.5v-1.2c0-.4.2-.7.5-.9l7.6-4.2V4c0-1.1.5-2 1.2-2z"/>
    </svg>
  </div>`;

  return L.divIcon({
    className: "flight-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html,
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
