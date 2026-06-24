import { useEffect, useRef } from "react";
import Gantt from "frappe-gantt";
import type { ViewMode } from "frappe-gantt";
import type { GanttTask } from "../types/gantt";
import "../../node_modules/frappe-gantt/dist/frappe-gantt.css";

interface GanttChartProps {
  tasks: GanttTask[];
  viewMode: ViewMode;
  isFullscreen?: boolean;
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

export function GanttChart({ tasks, viewMode, isFullscreen = false }: GanttChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<Gantt | null>(null);

  useEffect(() => {
    if (!chartRef.current || tasks.length === 0) {
      return;
    }

    chartRef.current.innerHTML = "";

    ganttInstance.current = new Gantt(chartRef.current, tasks, {
      view_mode: viewMode,
      bar_height: 28,
      padding: 18,
      custom_popup_html: (task) => {
        const days = durationDays(task.start, task.end);
        return `
          <div class="gantt-popup">
            <strong>${task.name}</strong>
            <p>Début : ${formatDate(task.start)}</p>
            <p>Fin : ${formatDate(task.end)}</p>
            <p>Durée : ${days} jour(s)</p>
          </div>
        `;
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.innerHTML = "";
      }
      ganttInstance.current = null;
    };
  }, [tasks]);

  useEffect(() => {
    ganttInstance.current?.change_view_mode(viewMode);
  }, [viewMode]);

  return (
    <div className={`gantt-scroll ${isFullscreen ? "gantt-scroll--fullscreen" : ""}`}>
      <div ref={chartRef} className="gantt-container" />
    </div>
  );
}
