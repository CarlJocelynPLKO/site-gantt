import type { Project } from "../types/gantt";

export const REVIEW_FREQUENCY_OPTIONS = [
  { value: 7, label: "Hebdomadaire (7 jours)" },
  { value: 14, label: "Toutes les 2 semaines" },
  { value: 30, label: "Mensuelle (30 jours)" },
  { value: 60, label: "Bimestrielle (60 jours)" },
  { value: 90, label: "Trimestrielle (90 jours)" },
] as const;

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatReviewDate(value: string | Date): string {
  const date = typeof value === "string" ? parseDateOnly(value) : value;
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function hasProjectReview(project: Pick<Project, "reviewFirstDate" | "reviewFrequencyDays">): boolean {
  return Boolean(project.reviewFirstDate && project.reviewFrequencyDays && project.reviewFrequencyDays > 0);
}

export function getNextReviewDate(
  firstDate: string,
  frequencyDays: number,
  referenceDate: Date = new Date(),
): Date | null {
  if (!firstDate || frequencyDays <= 0) {
    return null;
  }

  const first = startOfDay(parseDateOnly(firstDate));
  const today = startOfDay(referenceDate);
  const msPerDay = 86_400_000;

  if (today.getTime() <= first.getTime()) {
    return first;
  }

  const daysSince = Math.round((today.getTime() - first.getTime()) / msPerDay);

  if (daysSince % frequencyDays === 0) {
    return today;
  }

  const periodsAhead = Math.ceil(daysSince / frequencyDays);
  const next = new Date(first);
  next.setDate(next.getDate() + periodsAhead * frequencyDays);
  return next;
}

export function getProjectNextReviewDate(
  project: Pick<Project, "reviewFirstDate" | "reviewFrequencyDays">,
  referenceDate: Date = new Date(),
): Date | null {
  if (!hasProjectReview(project)) {
    return null;
  }

  return getNextReviewDate(project.reviewFirstDate!, project.reviewFrequencyDays!, referenceDate);
}

/** Vrai la veille d'une revue (la revue a lieu demain). */
export function isReviewTomorrow(
  project: Pick<Project, "reviewFirstDate" | "reviewFrequencyDays">,
  referenceDate: Date = new Date(),
): boolean {
  const nextReview = getProjectNextReviewDate(project, referenceDate);
  if (!nextReview) {
    return false;
  }

  const today = startOfDay(referenceDate);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return nextReview.getTime() === tomorrow.getTime();
}

export function toGanttTask(project: Project): Project & { custom_class?: string } {
  return {
    ...project,
    custom_class: isReviewTomorrow(project) ? "gantt-bar-review-due" : "",
  };
}

export function applyGanttReviewLabelStyles(container: HTMLElement, projects: Project[]): void {
  const projectsById = new Map(projects.map((project) => [project.id, project]));

  container.querySelectorAll<HTMLElement>(".bar-wrapper[data-id]").forEach((wrapper) => {
    const projectId = wrapper.getAttribute("data-id");
    const project = projectId ? projectsById.get(projectId) : undefined;
    const isDue = project ? isReviewTomorrow(project) : false;

    wrapper.querySelectorAll(".bar-label").forEach((label) => {
      label.classList.toggle("gantt-review-due-label", isDue);

      if (label instanceof SVGTextElement) {
        if (isDue) {
          label.setAttribute("fill", "#dc2626");
          label.style.fontWeight = "700";
        } else {
          label.removeAttribute("fill");
          label.style.fontWeight = "";
        }
      }
    });
  });
}
