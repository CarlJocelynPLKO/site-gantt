import { useCallback, useEffect, useMemo, useRef, useState, type Ref } from "react";
import Gantt from "frappe-gantt";
import type { ViewMode } from "frappe-gantt";
import type { Project } from "../types/gantt";
import { applyGanttFitToContainer, computeGanttBarLayout } from "../utils/ganttFitView";
import { applyGanttReviewLabelStyles, formatReviewDate, getProjectNextReviewDate, toGanttTask } from "../utils/projectReview";
import {
  formatPhasesForPopup,
  getProjectPhases,
  refreshGanttPhaseBars,
  setupGanttPhaseBars,
  type ProjectPhases,
} from "../utils/projectPhases";
import { toGanttDateString } from "../utils/ganttDate";
import { resolveProjectFromGanttEvent } from "../utils/ganttProjectHitTest";
import "../../node_modules/frappe-gantt/dist/frappe-gantt.css";

interface GanttWithRefresh extends Gantt {
  refresh: (tasks: ReturnType<typeof toGanttTask>[]) => void;
}

interface GanttChartProps {
  projects: Project[];
  viewMode: ViewMode;
  fitTrigger?: number;
  columnWidth?: number;
  onProjectClick?: (project: Project) => void;
  onProjectContextMenu?: (project: Project, x: number, y: number) => void;
  onProjectDatesChange?: (projectId: string, start: string, end: string) => void;
  onProjectPhasesChange?: (projectId: string, phases: ProjectPhases) => void;
  exportRef?: Ref<HTMLDivElement>;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR");
}

function durationDays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function formatAssignees(project: Project): string {
  if (!project.assignees?.length) {
    return "Aucune affectation";
  }
  return project.assignees.map((person) => `${person.firstName} (${person.jobTitle})`).join(", ");
}

export function GanttChart({
  projects,
  viewMode,
  fitTrigger = 0,
  columnWidth,
  onProjectClick,
  onProjectContextMenu,
  onProjectDatesChange,
  onProjectPhasesChange,
  exportRef,
}: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<Gantt | null>(null);
  const phaseBarsCleanupRef = useRef<(() => void) | null>(null);
  const skipGanttRefreshRef = useRef(false);
  const skipPhaseRefreshRef = useRef(false);
  const skipViewModeEffectRef = useRef(true);
  const prevDatesKeyRef = useRef<string | null>(null);
  const projectsRef = useRef(projects);
  const onProjectContextMenuRef = useRef(onProjectContextMenu);
  const onProjectDatesChangeRef = useRef(onProjectDatesChange);
  const onProjectPhasesChangeRef = useRef(onProjectPhasesChange);
  const onProjectClickRef = useRef(onProjectClick);
  const [barLayout, setBarLayout] = useState(() => ({ barHeight: 28, padding: 18 }));

  projectsRef.current = projects;
  onProjectContextMenuRef.current = onProjectContextMenu;
  onProjectDatesChangeRef.current = onProjectDatesChange;
  onProjectPhasesChangeRef.current = onProjectPhasesChange;
  onProjectClickRef.current = onProjectClick;

  const projectsListKey = useMemo(
    () => projects.map((project) => `${project.id}:${project.name}`).join("|"),
    [projects],
  );

  const datesKey = useMemo(
    () => projects.map((project) => `${project.id}:${project.start}:${project.end}`).join("|"),
    [projects],
  );

  const phasesKey = useMemo(
    () =>
      projects
        .map(
          (project) =>
            `${project.id}:${project.phaseEtudePct ?? 34}:${project.phaseChantierPct ?? 33}:${project.phaseLivraisonPct ?? 33}`,
        )
        .join("|"),
    [projects],
  );

  const applyReviewStyles = useCallback(() => {
    if (!chartRef.current) {
      return;
    }
    applyGanttReviewLabelStyles(chartRef.current, projectsRef.current);
  }, []);

  const applyPhaseBars = useCallback(() => {
    if (!chartRef.current) {
      return;
    }

    phaseBarsCleanupRef.current?.();
    phaseBarsCleanupRef.current = setupGanttPhaseBars(
      chartRef.current,
      projectsRef.current,
      (projectId, phases) => {
        skipPhaseRefreshRef.current = true;
        onProjectPhasesChangeRef.current?.(projectId, phases);
      },
    );
  }, []);

  const syncPhaseBars = useCallback(() => {
    if (!chartRef.current) {
      return;
    }
    refreshGanttPhaseBars(chartRef.current, projectsRef.current);
  }, []);

  const decorateGantt = useCallback(() => {
    applyReviewStyles();
    applyPhaseBars();
  }, [applyReviewStyles, applyPhaseBars]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || projects.length === 0) {
      return;
    }

    const updateBarLayout = () => {
      const nextLayout = computeGanttBarLayout(scrollElement.clientHeight, projects.length);
      setBarLayout((current) =>
        current.barHeight === nextLayout.barHeight && current.padding === nextLayout.padding
          ? current
          : nextLayout,
      );
    };

    updateBarLayout();
    const observer = new ResizeObserver(updateBarLayout);
    observer.observe(scrollElement);

    return () => observer.disconnect();
  }, [projects.length]);

  useEffect(() => {
    if (!chartRef.current || projects.length === 0) {
      return;
    }

    chartRef.current.innerHTML = "";

    const options: Record<string, unknown> = {
      view_mode: viewMode,
      bar_height: barLayout.barHeight,
      padding: barLayout.padding,
      popup_on: "hover",
      on_click: (bar: Project) => {
        const project =
          projectsRef.current.find((item) => item.id === bar.id) ?? bar;
        onProjectClickRef.current?.(project);
      },
      custom_popup_html: (bar: Project) => {
        const days = durationDays(bar.start, bar.end);
        const fullProject = projectsRef.current.find((item) => item.id === bar.id);
        const description = fullProject?.description?.trim();
        const descriptionBlock = description
          ? `<p>${description.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
          : "";
        const nextReview = fullProject?.reviewFirstDate && fullProject.reviewFrequencyDays
          ? getProjectNextReviewDate(fullProject)
          : null;
        const reviewBlock = nextReview
          ? `<p>Prochaine revue : ${formatReviewDate(nextReview)}</p>`
          : "";
        const phasesBlock = fullProject
          ? `<p>Phases :<br/>${formatPhasesForPopup(getProjectPhases(fullProject))}</p>`
          : "";
        return `
          <div class="gantt-popup">
            <strong>${bar.name}</strong>
            <p>Début : ${formatDate(bar.start)}</p>
            <p>Fin : ${formatDate(bar.end)}</p>
            <p>Durée : ${days} jour(s)</p>
            <p>Affectés : ${formatAssignees(fullProject ?? bar)}</p>
            ${reviewBlock}
            ${phasesBlock}
            ${descriptionBlock}
          </div>
        `;
      },
      on_date_change: (bar: Project, start: Date, end: Date) => {
        const existing = projectsRef.current.find((item) => item.id === bar.id);
        if (!existing) {
          return;
        }

        const newStart = toGanttDateString(start);
        const newEnd = toGanttDateString(end);

        if (newStart === existing.start && newEnd === existing.end) {
          return;
        }

        skipGanttRefreshRef.current = true;
        onProjectDatesChangeRef.current?.(bar.id, newStart, newEnd);
      },
    };

    if (columnWidth) {
      options.column_width = columnWidth;
    }

    ganttInstance.current = new Gantt(chartRef.current, projectsRef.current.map(toGanttTask), options);
    prevDatesKeyRef.current = datesKey;
    skipViewModeEffectRef.current = true;

    decorateGantt();
    requestAnimationFrame(decorateGantt);
    const timer = window.setTimeout(decorateGantt, 120);

    return () => {
      window.clearTimeout(timer);
      phaseBarsCleanupRef.current?.();
      phaseBarsCleanupRef.current = null;
      if (chartRef.current) {
        chartRef.current.innerHTML = "";
      }
      ganttInstance.current = null;
    };
  }, [projectsListKey, viewMode, columnWidth, barLayout.barHeight, barLayout.padding, decorateGantt]);

  useEffect(() => {
    if (!ganttInstance.current || !chartRef.current) {
      return;
    }

    if (prevDatesKeyRef.current === datesKey) {
      return;
    }

    prevDatesKeyRef.current = datesKey;

    if (skipGanttRefreshRef.current) {
      skipGanttRefreshRef.current = false;
      syncPhaseBars();
      applyReviewStyles();
      return;
    }

    (ganttInstance.current as GanttWithRefresh).refresh(projectsRef.current.map(toGanttTask));
    decorateGantt();
  }, [datesKey, decorateGantt, syncPhaseBars, applyReviewStyles]);

  useEffect(() => {
    if (!chartRef.current || !ganttInstance.current) {
      return;
    }

    if (skipPhaseRefreshRef.current) {
      skipPhaseRefreshRef.current = false;
      return;
    }

    syncPhaseBars();
  }, [phasesKey, syncPhaseBars]);

  useEffect(() => {
    if (!ganttInstance.current) {
      return;
    }

    if (skipViewModeEffectRef.current) {
      skipViewModeEffectRef.current = false;
      return;
    }

    ganttInstance.current.change_view_mode(viewMode);
    requestAnimationFrame(decorateGantt);
  }, [viewMode, decorateGantt]);

  useEffect(() => {
    if (!fitTrigger || !scrollRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (scrollRef.current) {
        applyGanttFitToContainer(scrollRef.current);
      }
    }, 80);

    return () => window.clearTimeout(timer);
  }, [fitTrigger, projects, viewMode, columnWidth]);

  useEffect(() => {
    const container = chartRef.current;
    if (!container || !onProjectContextMenu) {
      return;
    }

    const handleContextMenu = (event: MouseEvent) => {
      const project = resolveProjectFromGanttEvent(event.target, container, projectsRef.current);
      if (!project) {
        return;
      }

      event.preventDefault();
      onProjectContextMenuRef.current?.(project, event.clientX, event.clientY);
    };

    container.addEventListener("contextmenu", handleContextMenu);
    return () => container.removeEventListener("contextmenu", handleContextMenu);
  }, [onProjectContextMenu, projects.length]);

  return (
    <div ref={scrollRef} className="gantt-scroll">
      <div ref={exportRef} className="gantt-scale-wrapper" data-gantt-export-root>
        <div ref={chartRef} className="gantt-container gantt-container--interactive gantt-container--fill" />
      </div>
    </div>
  );
}
