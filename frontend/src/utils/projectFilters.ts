import type { Project } from "../types/gantt";

export interface ProjectFilters {
  personId: string;
  jobTitle: string;
}

export const EMPTY_PROJECT_FILTERS: ProjectFilters = {
  personId: "",
  jobTitle: "",
};

export function filterProjects(projects: Project[], filters: ProjectFilters): Project[] {
  return projects.filter((project) => {
    if (filters.personId) {
      const hasPerson = project.assignees?.some((person) => person.id === filters.personId);
      if (!hasPerson) {
        return false;
      }
    }

    if (filters.jobTitle) {
      const hasJobTitle = project.assignees?.some((person) => person.jobTitle === filters.jobTitle);
      if (!hasJobTitle) {
        return false;
      }
    }

    return true;
  });
}

export function collectJobTitlesFromProjects(projects: Project[]): string[] {
  const titles = new Set<string>();

  for (const project of projects) {
    for (const assignee of project.assignees ?? []) {
      titles.add(assignee.jobTitle);
    }
  }

  return [...titles].sort((a, b) => a.localeCompare(b, "fr"));
}
