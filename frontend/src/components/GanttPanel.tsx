import { useCallback, useMemo, useRef, useState } from "react";
import type { ViewMode } from "frappe-gantt";
import type { Ref } from "react";
import type { Project } from "../types/gantt";
import type { Person } from "../types/team";
import { buildExportFilename, exportGanttChart } from "../utils/exportChart";
import { getProjectDateRange, suggestViewModeForRange } from "../utils/ganttFitView";
import {
  collectJobTitlesFromProjects,
  EMPTY_PROJECT_FILTERS,
  filterProjects,
  type ProjectFilters,
} from "../utils/projectFilters";
import { countProjectsByStatus } from "../utils/projectStatus";
import { PHASE_META, type ProjectPhases } from "../utils/projectPhases";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { CalendarTitle } from "./CalendarTitle";
import { ExportMenu, type ExportFormat } from "./ExportMenu";
import { GanttChart } from "./GanttChart";
import { GanttFilters } from "./GanttFilters";
import { ProjectsDrawer } from "./ProjectsDrawer";
import { ZoomControls } from "./ZoomControls";
interface GanttPanelProps {
  panelRef?: Ref<HTMLElement>;
  calendarName?: string;
  calendarGroupName?: string;
  onRenameCalendar?: (name: string) => Promise<void>;
  saving?: boolean;
  projects: Project[];
  calendarPeople?: Person[];
  warnings: string[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onExportError?: (message: string) => void;
  onAddProject?: () => void;
  onImport: () => void;
  onDeleteProject?: (projectId: string) => void;
  onProjectClick?: (project: Project) => void;
  onProjectDatesChange?: (projectId: string, start: string, end: string) => void;
  onProjectPhasesChange?: (projectId: string, phases: ProjectPhases) => void;
  showManualEntry?: boolean;
}

export function GanttPanel({
  panelRef,
  calendarName,
  calendarGroupName,
  onRenameCalendar,
  saving = false,
  projects,
  calendarPeople = [],
  warnings,
  viewMode,
  onViewModeChange,
  onExportError,
  onAddProject,
  onImport,
  onDeleteProject,
  onProjectClick,
  onProjectDatesChange,
  onProjectPhasesChange,
  showManualEntry = true,
}: GanttPanelProps) {
  const [fitTrigger, setFitTrigger] = useState(0);
  const [columnWidth, setColumnWidth] = useState<number | undefined>(undefined);
  const [filters, setFilters] = useState<ProjectFilters>(EMPTY_PROJECT_FILTERS);
  const [menu, setMenu] = useState<{ x: number; y: number; project: Project } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [projectsDrawerOpen, setProjectsDrawerOpen] = useState(false);
  const ganttExportRef = useRef<HTMLDivElement>(null);
  const jobTitles = useMemo(() => collectJobTitlesFromProjects(projects), [projects]);
  const filteredProjects = useMemo(() => filterProjects(projects, filters), [projects, filters]);
  const activeProjectCount = useMemo(() => countProjectsByStatus(projects).active, [projects]);

  const handleFitView = useCallback(() => {
    const range = getProjectDateRange(filteredProjects);
    if (!range) {
      return;
    }

    const suggestedMode = suggestViewModeForRange(range.start, range.end);
    onViewModeChange(suggestedMode);
    setColumnWidth(undefined);
    setFitTrigger((value) => value + 1);
  }, [filteredProjects, onViewModeChange]);

  const handleProjectContextMenu = useCallback((project: Project, x: number, y: number) => {
    setMenu({ x, y, project });
  }, []);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!ganttExportRef.current) {
        onExportError?.("Le diagramme n'est pas prêt pour l'export.");
        return;
      }

      setExporting(true);
      try {
        const filename = buildExportFilename(calendarName, format);
        await exportGanttChart(ganttExportRef.current, format, filename);
      } catch (err) {
        onExportError?.(err instanceof Error ? err.message : "Export impossible.");
      } finally {
        setExporting(false);
      }
    },
    [calendarName, onExportError],
  );
  const menuItems: ContextMenuItem[] = menu
    ? [
        {
          label: "Ouvrir",
          onClick: () => onProjectClick?.(menu.project),
        },
        {
          label: "Supprimer",
          danger: true,
          onClick: () => {
            if (window.confirm(`Supprimer le projet « ${menu.project.name} » ?`)) {
              onDeleteProject?.(menu.project.id);
            }
          },
        },
      ]
    : [];

  return (
    <section className="gantt-panel" ref={panelRef}>
      <div className="gantt-panel-header">
        {calendarName && onRenameCalendar ? (
          <CalendarTitle name={calendarName} saving={saving} onRename={onRenameCalendar} />
        ) : (
          calendarName && <h2 className="gantt-title">{calendarName}</h2>
        )}

        {calendarGroupName && <p className="project-team-label">Équipe : {calendarGroupName}</p>}
      </div>

      {projects.length > 0 ? (
        <>
          <div className="gantt-panel-controls">
            <div className="gantt-toolbar">
              <ZoomControls viewMode={viewMode} onChange={onViewModeChange} />
              <div className="export-actions">
                {onAddProject && (
                  <button
                    type="button"
                    className="btn btn-primary gantt-add-btn"
                    onClick={onAddProject}
                    title="Ajouter un projet"
                    aria-label="Ajouter un projet"
                  >
                    +
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setProjectsDrawerOpen(true)}
                >
                  Liste des projets
                  {activeProjectCount > 0 && (
                    <span className="projects-drawer-trigger-count">{activeProjectCount}</span>
                  )}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleFitView}>
                  Ajuster la vue
                </button>
                <ExportMenu
                  disabled={exporting || filteredProjects.length === 0}
                  onExport={(format) => void handleExport(format)}
                />
              </div>
            </div>

            <GanttFilters
              people={calendarPeople}
              jobTitles={jobTitles}
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(EMPTY_PROJECT_FILTERS)}
            />

            <div className="gantt-phase-legend" aria-label="Légende des phases projet">
              {(Object.keys(PHASE_META) as Array<keyof typeof PHASE_META>).map((key) => (
                <span key={key} className="gantt-phase-legend-item">
                  <span
                    className="gantt-phase-legend-swatch"
                    style={{ backgroundColor: PHASE_META[key].color }}
                  />
                  {PHASE_META[key].label}
                </span>
              ))}
              <span className="gantt-phase-legend-hint muted">
                Glissez les séparateurs sur une barre pour ajuster les phases
              </span>
            </div>
          </div>

          <div className="gantt-panel-body">
            {filteredProjects.length === 0 ? (
              <p className="muted gantt-filter-empty">
                Aucun projet ne correspond aux filtres sélectionnés.
              </p>
            ) : (
              <GanttChart
                projects={filteredProjects}
                viewMode={viewMode}
                fitTrigger={fitTrigger}
                columnWidth={columnWidth}
                exportRef={ganttExportRef}
                onProjectClick={onProjectClick}
                onProjectContextMenu={handleProjectContextMenu}
                onProjectDatesChange={onProjectDatesChange}
                onProjectPhasesChange={onProjectPhasesChange}
              />
            )}
          </div>

          {warnings.length > 0 && (
            <ul className="warning-list">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="gantt-empty">
          <p className="muted">Ce calendrier ne contient pas encore de projets.</p>
          <div className="gantt-empty-actions">
            {showManualEntry && onAddProject && (
              <button type="button" className="btn btn-primary" onClick={onAddProject}>
                Ajouter un projet
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onImport}>
              Importer un fichier
            </button>
          </div>
        </div>
      )}

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
      )}

      <ProjectsDrawer
        open={projectsDrawerOpen}
        projects={projects}
        onClose={() => setProjectsDrawerOpen(false)}
        onProjectClick={(project) => onProjectClick?.(project)}
        onDeleteProject={onDeleteProject}
      />
    </section>
  );
}
