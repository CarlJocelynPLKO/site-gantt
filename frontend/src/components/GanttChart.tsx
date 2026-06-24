import { useEffect, useRef } from "react";
import Gantt from "frappe-gantt";
import type { ViewMode } from "frappe-gantt";
import type { GanttTask } from "../types/gantt";
import { applyGanttFitToContainer } from "../utils/ganttFitView";
import "../../node_modules/frappe-gantt/dist/frappe-gantt.css";

interface GanttChartProps {
  tasks: GanttTask[];
  viewMode: ViewMode;
  isFullscreen?: boolean;
  fitTrigger?: number;
  columnWidth?: number;
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

function formatAssignees(task: GanttTask): string {
  if (!task.assignees?.length) {
    return "Aucune affectation";
  }
  return task.assignees.map((person) => `${person.firstName} (${person.jobTitle})`).join(", ");
}

export function GanttChart({
  tasks,
  viewMode,
  isFullscreen = false,
  fitTrigger = 0,
  columnWidth,
}: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<Gantt | null>(null);

  useEffect(() => {
    if (!chartRef.current || tasks.length === 0) {
      return;
    }

    chartRef.current.innerHTML = "";

    const options: Record<string, unknown> = {
      view_mode: viewMode,
      bar_height: 28,
      padding: 18,
      custom_popup_html: (task: GanttTask) => {
        const days = durationDays(task.start, task.end);
        const fullTask = tasks.find((item) => item.id === task.id);
        return `
          <div class="gantt-popup">
            <strong>${task.name}</strong>
            <p>Début : ${formatDate(task.start)}</p>
            <p>Fin : ${formatDate(task.end)}</p>
            <p>Durée : ${days} jour(s)</p>
            <p>Affectés : ${formatAssignees(fullTask ?? task)}</p>
          </div>
        `;
      },
    };

    if (columnWidth) {
      options.column_width = columnWidth;
    }

    ganttInstance.current = new Gantt(chartRef.current, tasks, options);

    return () => {
      if (chartRef.current) {
        chartRef.current.innerHTML = "";
      }
      ganttInstance.current = null;
    };
  }, [tasks, viewMode, columnWidth]);

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
  }, [fitTrigger, tasks, viewMode, columnWidth]);

  return (
    <div
      ref={scrollRef}
      className={`gantt-scroll ${isFullscreen ? "gantt-scroll--fullscreen" : ""}`}
    >
      <div className="gantt-scale-wrapper">
        <div ref={chartRef} className="gantt-container" />
      </div>
    </div>
  );
}
