import type { Project } from "./gantt";
import type { Person, TeamGroup } from "./team";

export type AppStep = "dashboard" | "calendar" | "groups" | "upload" | "analyzing" | "mapping";

export interface Calendar {
  id: string;
  name: string;
  groupId: string | null;
  projects: Project[];
}

export interface ProjectInput {
  name: string;
  start: string;
  end: string;
  progress?: number;
  assigneeIds?: string[];
}

export type { Person, TeamGroup };
