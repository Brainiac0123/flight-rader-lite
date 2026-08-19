import { AlertTriangle, Radar, RadioTower, WifiOff } from "lucide-react";

export type RadarStatus = "live" | "demo" | "empty" | "error" | "loading";

const CONFIG: Record<
  RadarStatus,
  { label: string; icon: typeof Radar; tone: string; dot: string }
> = {
  live: {
    label: "Live",
    icon: RadioTower,
    tone: "text-telemetry",
    dot: "bg-telemetry",
  },
  demo: {
    label: "Demo feed",
    icon: Radar,
    tone: "text-secondary",
    dot: "bg-secondary",
  },
  empty: {
    label: "No flights",
    icon: Radar,
    tone: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  error: {
    label: "Feed error",
    icon: WifiOff,
    tone: "text-destructive",
    dot: "bg-destructive",
  },
  loading: {
    label: "Acquiring",
    icon: AlertTriangle,
    tone: "text-primary",
    dot: "bg-primary",
  },
};

interface StatusBannerProps {
  status: RadarStatus;
  detail?: string;
  className?: string;
}

export function StatusBanner({ status, detail, className }: StatusBannerProps) {
  const config = CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2 rounded-full border border-border bg-panel-strong/90 px-3 py-1.5 backdrop-blur ${className ?? ""}`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full scan-pulse ${config.dot}`} />
      <Icon className={`h-3.5 w-3.5 shrink-0 ${config.tone}`} aria-hidden="true" />
      <span className={`font-mono text-[11px] font-medium tracking-wide ${config.tone}`}>
        {config.label}
      </span>
      {detail ? (
        <span className="truncate font-mono text-[11px] text-muted-foreground">{detail}</span>
      ) : null}
    </div>
  );
}
