import type { GanttTask } from "./gantt";

export type AppStep = "dashboard" | "project" | "upload" | "analyzing" | "mapping" | "gantt";

export interface Project {
  id: string;
  name: string;
  tasks: GanttTask[];
}
