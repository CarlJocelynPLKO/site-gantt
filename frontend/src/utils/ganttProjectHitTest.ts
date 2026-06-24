import type { Project } from "../types/gantt";

export function resolveProjectFromGanttEvent(
  target: EventTarget | null,
  container: HTMLElement,
  projects: Project[],
): Project | null {
  let element = target instanceof HTMLElement ? target : null;

  while (element && element !== container) {
    const projectId = element.getAttribute("data-id");
    if (projectId) {
      return projects.find((project) => project.id === projectId) ?? null;
    }
    element = element.parentElement;
  }

  const row = (target as HTMLElement | null)?.closest?.(".grid-row");
  if (!row || !container.contains(row)) {
    return null;
  }

  const rows = Array.from(container.querySelectorAll(".grid-row"));
  const index = rows.indexOf(row);
  if (index < 0 || index >= projects.length) {
    return null;
  }

  return projects[index] ?? null;
}
