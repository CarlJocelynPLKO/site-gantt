import { useEffect, useRef } from "react";
import Gantt from "frappe-gantt";
import type { ViewMode } from "frappe-gantt";
import type { GanttTask } from "../types/gantt";
import "../../node_modules/frappe-gantt/dist/frappe-gantt.css";

// 1. L'interface (les ingrédients fournis par le parent)
interface GanttChartProps {
  tasks: GanttTask[];
  viewMode: ViewMode;
  // J'ai retiré chartRef d'ici, ce n'est pas un ingrédient externe !
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

// 2. Le composant principal
export function GanttChart({ tasks, viewMode }: GanttChartProps) {
  // 3. C'est ICI qu'on crée nos références internes !
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
  }, [tasks]); // J'ai aussi enlevé chartRef des dépendances ici, car un useRef ne change jamais

  useEffect(() => {
    ganttInstance.current?.change_view_mode(viewMode);
  }, [viewMode]);

  return (
    <div className="gantt-scroll">
      <div ref={chartRef} className="gantt-container" />
    </div>
  );
}