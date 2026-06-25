import { useEffect, useMemo, useState, type MouseEvent } from "react";
import type { Project } from "../types/gantt";
import { isReviewTomorrow } from "../utils/projectReview";
import {
  countProjectsByStatus,
  filterProjectsByStatus,
  formatProjectDateRange,
  getProjectStatus,
  PROJECT_STATUS_LABELS,
  type ProjectStatusFilter,
} from "../utils/projectStatus";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";

interface ProjectsDrawerProps {
  open: boolean;
  projects: Project[];
  onClose: () => void;
  onProjectClick: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
}

function formatAssignees(project: Project): string {
  if (!project.assignees?.length) {
    return "Non affecté";
  }
  return project.assignees.map((person) => person.firstName).join(", ");
}

const FILTER_ORDER: ProjectStatusFilter[] = ["active", "upcoming", "finished", "all"];

export function ProjectsDrawer({
  open,
  projects,
  onClose,
  onProjectClick,
  onDeleteProject,
}: ProjectsDrawerProps) {
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("active");
  const [menu, setMenu] = useState<{ x: number; y: number; project: Project } | null>(null);

  const counts = useMemo(() => countProjectsByStatus(projects), [projects]);
  const visibleProjects = useMemo(
    () => filterProjectsByStatus(projects, statusFilter),
    [projects, statusFilter],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.classList.add("projects-drawer-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("projects-drawer-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const menuItems: ContextMenuItem[] = menu
    ? [
        {
          label: "Ouvrir",
          onClick: () => {
            onProjectClick(menu.project);
            onClose();
          },
        },
        ...(onDeleteProject
          ? [
              {
                label: "Supprimer",
                danger: true,
                onClick: () => {
                  if (window.confirm(`Supprimer le projet « ${menu.project.name} » ?`)) {
                    onDeleteProject(menu.project.id);
                  }
                },
              } satisfies ContextMenuItem,
            ]
          : []),
      ]
    : [];

  const openMenu = (event: MouseEvent, project: Project) => {
    event.preventDefault();
    event.stopPropagation();
    setMenu({ x: event.clientX, y: event.clientY, project });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="projects-drawer-root" role="presentation" onClick={onClose}>
      <aside
        className="projects-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="projects-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="projects-drawer-header">
          <div>
            <h2 id="projects-drawer-title">Projets du calendrier</h2>
            <p className="muted projects-drawer-subtitle">
              {counts.active} en cours · {counts.upcoming} à venir · {counts.finished} terminés
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        <div className="projects-drawer-filters" role="tablist" aria-label="Filtrer les projets">
          {FILTER_ORDER.map((filter) => {
            const count = filter === "all" ? projects.length : counts[filter];
            return (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={statusFilter === filter}
                className={`projects-drawer-filter${statusFilter === filter ? " projects-drawer-filter--active" : ""}`}
                onClick={() => setStatusFilter(filter)}
              >
                {PROJECT_STATUS_LABELS[filter]}
                <span className="projects-drawer-filter-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="projects-drawer-body">
          {visibleProjects.length === 0 ? (
            <p className="muted projects-drawer-empty">
              Aucun projet {statusFilter === "all" ? "" : PROJECT_STATUS_LABELS[statusFilter].toLowerCase()}.
            </p>
          ) : (
            <ul className="projects-drawer-list">
              {visibleProjects.map((project) => {
                const status = getProjectStatus(project);
                const reviewDue = isReviewTomorrow(project);

                return (
                  <li key={project.id}>
                    <button
                      type="button"
                      className="projects-drawer-item"
                      onClick={() => {
                        onProjectClick(project);
                        onClose();
                      }}
                      onContextMenu={(event) => openMenu(event, project)}
                    >
                      <div className="projects-drawer-item-main">
                        <span
                          className={`projects-drawer-item-name${reviewDue ? " projects-drawer-item-name--alert" : ""}`}
                        >
                          {project.name}
                        </span>
                        <span className={`projects-drawer-status projects-drawer-status--${status}`}>
                          {PROJECT_STATUS_LABELS[status]}
                        </span>
                      </div>
                      <span className="projects-drawer-item-dates">
                        {formatProjectDateRange(project.start, project.end)}
                      </span>
                      <span className="projects-drawer-item-assignees">{formatAssignees(project)}</span>
                      {reviewDue && (
                        <span className="projects-drawer-item-review">Revue demain</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
      )}
    </div>
  );
}
