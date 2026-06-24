import type { GanttTask } from "./gantt";
import type { Person, TeamGroup } from "./team";

export type AppStep = "dashboard" | "project" | "groups" | "upload" | "analyzing" | "mapping";

export interface Project {
  id: string;
  name: string;
  groupId: string | null;
  tasks: GanttTask[];
}

export interface ProjectTaskInput {
  name: string;
  start: string;
  end: string;
  progress?: number;
  assigneeIds?: string[];
}

export type { Person, TeamGroup };
