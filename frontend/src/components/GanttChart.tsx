import { useEffect, useRef, type Ref } from "react";
import Gantt from "frappe-gantt";
import type { ViewMode } from "frappe-gantt";
import type { Project } from "../types/gantt";
import { applyGanttFitToContainer } from "../utils/ganttFitView";
import { toGanttDateString } from "../utils/ganttDate";
import { resolveProjectFromGanttEvent } from "../utils/ganttProjectHitTest";
import "../../node_modules/frappe-gantt/dist/frappe-gantt.css";

interface GanttChartProps {
  projects: Project[];
  viewMode: ViewMode;
  isFullscreen?: boolean;
  fitTrigger?: number;
  columnWidth?: number;
  onProjectContextMenu?: (project: Project, x: number, y: number) => void;
  onProjectDatesChange?: (projectId: string, start: string, end: string) => void;
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
  isFullscreen = false,
  fitTrigger = 0,
  columnWidth,
  onProjectContextMenu,
  onProjectDatesChange,
  exportRef,
}: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<Gantt | null>(null);
  const projectsRef = useRef(projects);
  const onProjectContextMenuRef = useRef(onProjectContextMenu);
  const onProjectDatesChangeRef = useRef(onProjectDatesChange);

  projectsRef.current = projects;
  onProjectContextMenuRef.current = onProjectContextMenu;
  onProjectDatesChangeRef.current = onProjectDatesChange;

  useEffect(() => {
    if (!chartRef.current || projects.length === 0) {
      return;
    }

    chartRef.current.innerHTML = "";

    const options: Record<string, unknown> = {
      view_mode: viewMode,
      bar_height: 28,
      padding: 18,
      custom_popup_html: (bar: Project) => {
        const days = durationDays(bar.start, bar.end);
        const fullProject = projects.find((item) => item.id === bar.id);
        const description = fullProject?.description?.trim();
        const descriptionBlock = description
          ? `<p>${description.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
          : "";
        return `
          <div class="gantt-popup">
            <strong>${bar.name}</strong>
            <p>Début : ${formatDate(bar.start)}</p>
            <p>Fin : ${formatDate(bar.end)}</p>
            <p>Durée : ${days} jour(s)</p>
            <p>Affectés : ${formatAssignees(fullProject ?? bar)}</p>
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

        onProjectDatesChangeRef.current?.(bar.id, newStart, newEnd);
      },
    };

    if (columnWidth) {
      options.column_width = columnWidth;
    }

    ganttInstance.current = new Gantt(chartRef.current, projects, options);

    return () => {
      if (chartRef.current) {
        chartRef.current.innerHTML = "";
      }
      ganttInstance.current = null;
    };
  }, [projects, viewMode, columnWidth]);

  useEffect(() => {
    ganttInstance.current?.change_view_mode(viewMode);
  }, [viewMode]);

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
    <div
      ref={scrollRef}
      className={`gantt-scroll ${isFullscreen ? "gantt-scroll--fullscreen" : ""}`}
    >
      <div ref={exportRef} className="gantt-scale-wrapper" data-gantt-export-root>
        <div ref={chartRef} className="gantt-container gantt-container--interactive" />
      </div>
    </div>
  );
}
