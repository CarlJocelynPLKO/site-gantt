import type { ViewMode } from "frappe-gantt";
import type { Project } from "../types/gantt";

export function getProjectDateRange(projects: Project[]): { start: Date; end: Date } | null {
  if (projects.length === 0) {
    return null;
  }

  let min = new Date(projects[0].start);
  let max = new Date(projects[0].end);

  for (const project of projects) {
    const start = new Date(project.start);
    const end = new Date(project.end);
    if (start < min) {
      min = start;
    }
    if (end > max) {
      max = end;
    }
  }

  const paddingDays = 3;
  min.setDate(min.getDate() - paddingDays);
  max.setDate(max.getDate() + paddingDays);

  return { start: min, end: max };
}

export function suggestViewModeForRange(start: Date, end: Date): ViewMode {
  const days = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (days <= 21) {
    return "Day";
  }
  if (days <= 120) {
    return "Week";
  }
  return "Month";
}

export function computeGanttBarLayout(
  containerHeight: number,
  taskCount: number,
): { barHeight: number; padding: number } {
  const defaults = { barHeight: 28, padding: 18 };

  if (containerHeight <= 0 || taskCount <= 0) {
    return defaults;
  }

  const gridHeaderHeight = 72;
  const available = containerHeight - gridHeaderHeight;
  const perRow = available / taskCount;

  if (perRow <= defaults.barHeight + defaults.padding) {
    return defaults;
  }

  const padding = Math.round(Math.min(36, Math.max(14, perRow * 0.22)));
  const barHeight = Math.round(Math.min(80, Math.max(28, perRow - padding)));

  return { barHeight, padding };
}

export function applyGanttFitToContainer(scrollElement: HTMLElement): number {
  const svg = scrollElement.querySelector("svg");
  if (!svg) {
    return 1;
  }

  const containerWidth = scrollElement.clientWidth;
  const svgWidth = svg.getBoundingClientRect().width;

  if (containerWidth <= 0 || svgWidth <= 0) {
    return 1;
  }

  const scale = Math.min(1, containerWidth / svgWidth);
  const wrapper = scrollElement.querySelector<HTMLElement>(".gantt-scale-wrapper");

  if (wrapper) {
    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.width = `${100 / scale}%`;
  }

  scrollElement.scrollLeft = 0;
  return scale;
}
