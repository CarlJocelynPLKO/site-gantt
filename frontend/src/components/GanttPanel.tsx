import type { ViewMode } from "frappe-gantt";
import type { Ref } from "react";
import type { GanttTask } from "../types/gantt";
import { GanttChart } from "./GanttChart";
import { ZoomControls } from "./ZoomControls";

interface GanttPanelProps {
  panelRef?: Ref<HTMLElement>;
  projectName?: string;
  tasks: GanttTask[];
  warnings: string[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onAddTask?: () => void;
  onImport: () => void;
  showManualEntry?: boolean;
}

export function GanttPanel({
  panelRef,
  projectName,
  tasks,
  warnings,
  viewMode,
  onViewModeChange,
  onExportPng,
  onExportSvg,
  onAddTask,
  onImport,
  showManualEntry = true,
}: GanttPanelProps) {
  return (
    <section className="gantt-panel" ref={panelRef}>
      {projectName && <h2 className="gantt-title">{projectName}</h2>}

      {tasks.length > 0 ? (
        <>
          <div className="gantt-toolbar">
            <ZoomControls viewMode={viewMode} onChange={onViewModeChange} />
            <div className="export-actions">
              <button type="button" className="btn btn-secondary" onClick={onExportPng}>
                Exporter PNG
              </button>
              <button type="button" className="btn btn-secondary" onClick={onExportSvg}>
                Exporter SVG
              </button>
            </div>
          </div>

          {warnings.length > 0 && (
            <ul className="warning-list">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}

          <GanttChart tasks={tasks} viewMode={viewMode} />
        </>
      ) : (
        <div className="gantt-empty">
          <p className="muted">Ce projet ne contient pas encore de tâches.</p>
          <div className="gantt-empty-actions">
            {showManualEntry && onAddTask && (
              <button type="button" className="btn btn-primary" onClick={onAddTask}>
                Ajouter une tâche
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onImport}>
              Importer un fichier
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
