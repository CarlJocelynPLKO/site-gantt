import type { ViewMode } from "frappe-gantt";

interface ZoomControlsProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const MODES: { label: string; value: ViewMode }[] = [
  { label: "Jour", value: "Day" },
  { label: "Semaine", value: "Week" },
  { label: "Mois", value: "Month" },
];

export function ZoomControls({ viewMode, onChange }: ZoomControlsProps) {
  return (
    <div className="zoom-controls" role="group" aria-label="Échelle de temps">
      {MODES.map((mode) => (
        <button
          key={mode.value}
          type="button"
          className={`btn btn-ghost ${viewMode === mode.value ? "active" : ""}`}
          onClick={() => onChange(mode.value)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
