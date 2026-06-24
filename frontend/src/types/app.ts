import type { GanttTask } from "./gantt";

export type AppStep = "dashboard" | "project" | "upload" | "analyzing" | "mapping";

export interface Project {
  id: string;
  name: string;
  tasks: GanttTask[];
}
