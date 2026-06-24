import { useState, type MouseEvent } from "react";
import type { Project } from "../types/gantt";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";

interface ProjectListProps {
  projects: Project[];
  onDeleteProject: (projectId: string) => void;
  onShowProjectDetails: (project: Project) => void;
}

function formatAssignees(project: Project): string {
  if (!project.assignees?.length) {
    return "Non affecté";
  }
  return project.assignees.map((person) => `${person.firstName} (${person.jobTitle})`).join(", ");
}

export function ProjectList({ projects, onDeleteProject, onShowProjectDetails }: ProjectListProps) {
  const [menu, setMenu] = useState<{ x: number; y: number; project: Project } | null>(null);

  const openMenu = (event: MouseEvent, project: Project) => {
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY, project });
  };

  const menuItems: ContextMenuItem[] = menu
    ? [
        {
          label: "Détails",
          onClick: () => onShowProjectDetails(menu.project),
        },
        {
          label: "Supprimer",
          danger: true,
          onClick: () => {
            if (window.confirm(`Supprimer le projet « ${menu.project.name} » ?`)) {
              onDeleteProject(menu.project.id);
            }
          },
        },
      ]
    : [];

  const badge = `${projects.length} projet${projects.length > 1 ? "s" : ""}`;

  return (
    <CollapsiblePanel
      title="Projets du calendrier"
      className="task-list-panel"
      badge={badge}
      defaultOpen={projects.length > 0}
    >
      {projects.length === 0 ? (
        <p className="muted">Ce calendrier ne contient pas encore de projet.</p>
      ) : (
        <ul className="task-list">
          {projects.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                className="task-list-item"
                onContextMenu={(event) => openMenu(event, project)}
              >
                <span className="task-list-name">{project.name}</span>
                <span className="task-list-dates">
                  {project.start} → {project.end} · {formatAssignees(project)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
      )}
    </CollapsiblePanel>
  );
}
