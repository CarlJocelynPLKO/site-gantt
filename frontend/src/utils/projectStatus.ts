import type { Project } from "../types/gantt";

export type ProjectStatusFilter = "active" | "upcoming" | "finished" | "all";

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getProjectStatus(
  project: Pick<Project, "start" | "end">,
  referenceDate: Date = new Date(),
): Exclude<ProjectStatusFilter, "all"> {
  const today = startOfDay(referenceDate).getTime();
  const start = startOfDay(parseDateOnly(project.start)).getTime();
  const end = startOfDay(parseDateOnly(project.end)).getTime();

  if (today < start) {
    return "upcoming";
  }
  if (today > end) {
    return "finished";
  }
  return "active";
}

export function filterProjectsByStatus(
  projects: Project[],
  status: ProjectStatusFilter,
  referenceDate: Date = new Date(),
): Project[] {
  if (status === "all") {
    return [...projects].sort(compareProjectsByStart);
  }

  return projects
    .filter((project) => getProjectStatus(project, referenceDate) === status)
    .sort(compareProjectsByStart);
}

export function countProjectsByStatus(
  projects: Project[],
  referenceDate: Date = new Date(),
): Record<Exclude<ProjectStatusFilter, "all">, number> {
  return projects.reduce(
    (counts, project) => {
      const status = getProjectStatus(project, referenceDate);
      counts[status] += 1;
      return counts;
    },
    { active: 0, upcoming: 0, finished: 0 },
  );
}

function compareProjectsByStart(a: Project, b: Project): number {
  return parseDateOnly(a.start).getTime() - parseDateOnly(b.start).getTime();
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatusFilter, string> = {
  active: "En cours",
  upcoming: "À venir",
  finished: "Terminés",
  all: "Tous",
};

export function formatProjectDateRange(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${formatter.format(parseDateOnly(start))} → ${formatter.format(parseDateOnly(end))}`;
}
