import { useCallback, useEffect, useState } from "react";
import type { ViewMode } from "frappe-gantt";
import type { Ref } from "react";
import type { GanttTask } from "../types/gantt";
import { getTaskDateRange, suggestViewModeForRange } from "../utils/ganttFitView";
import { GanttChart } from "./GanttChart";
import { ProjectTitle } from "./ProjectTitle";
import { ZoomControls } from "./ZoomControls";

interface GanttPanelProps {
  panelRef?: Ref<HTMLElement>;
  projectName?: string;
  projectGroupName?: string;
  onRenameProject?: (name: string) => Promise<void>;
  saving?: boolean;
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
  projectGroupName,
  onRenameProject,
  saving = false,
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [columnWidth, setColumnWidth] = useState<number | undefined>(undefined);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    document.body.classList.remove("gantt-fullscreen-active");
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((current) => {
      const next = !current;
      document.body.classList.toggle("gantt-fullscreen-active", next);
      return next;
    });
  }, []);

  const handleFitView = useCallback(() => {
    const range = getTaskDateRange(tasks);
    if (!range) {
      return;
    }

    const suggestedMode = suggestViewModeForRange(range.start, range.end);
    onViewModeChange(suggestedMode);
    setColumnWidth(undefined);
    setFitTrigger((value) => value + 1);
  }, [tasks, onViewModeChange]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        exitFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("gantt-fullscreen-active");
    };
  }, [isFullscreen, exitFullscreen]);

  return (
    <section
      className={`gantt-panel ${isFullscreen ? "gantt-panel--fullscreen" : ""}`}
      ref={panelRef}
    >
      {projectName && onRenameProject ? (
        <ProjectTitle name={projectName} saving={saving} onRename={onRenameProject} />
      ) : (
        projectName && <h2 className="gantt-title">{projectName}</h2>
      )}

      {projectGroupName && <p className="project-team-label">Équipe : {projectGroupName}</p>}

      {tasks.length > 0 ? (
        <>
          <div className="gantt-toolbar">
            <ZoomControls viewMode={viewMode} onChange={onViewModeChange} />
            <div className="export-actions">
              <button type="button" className="btn btn-secondary" onClick={handleFitView}>
                Ajuster la vue
              </button>
              <button type="button" className="btn btn-secondary" onClick={toggleFullscreen}>
                {isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              </button>
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

          <GanttChart
            tasks={tasks}
            viewMode={viewMode}
            isFullscreen={isFullscreen}
            fitTrigger={fitTrigger}
            columnWidth={columnWidth}
          />
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
