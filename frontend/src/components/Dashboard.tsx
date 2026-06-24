import { FormEvent, useState, type MouseEvent } from "react";
import type { Project, TeamGroup } from "../types/app";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";

interface DashboardProps {
  projects: Project[];
  groups: TeamGroup[];
  saving?: boolean;
  onCreateProject: (name: string, groupId: string | null) => Promise<void>;
  onOpenProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  onImport: () => void;
  onManageGroups: () => void;
}

export function Dashboard({
  projects,
  groups,
  saving = false,
  onCreateProject,
  onOpenProject,
  onDeleteProject,
  onImport,
  onManageGroups,
}: DashboardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [groupId, setGroupId] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; projectId: string } | null>(null);

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!projectName.trim()) {
      setFormError("Veuillez saisir un nom de projet.");
      return;
    }

    try {
      await onCreateProject(projectName.trim(), groupId || null);
      setProjectName("");
      setGroupId("");
      setShowCreateForm(false);
    } catch {
      // L'erreur est affichée par App via la bannière.
    }
  };

  const openProjectMenu = (event: MouseEvent, projectId: string) => {
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY, projectId });
  };

  const menuItems: ContextMenuItem[] = menu
    ? [
        {
          label: "Supprimer le projet",
          danger: true,
          onClick: () => {
            const project = projects.find((item) => item.id === menu.projectId);
            const label = project?.name ?? "ce projet";
            if (window.confirm(`Supprimer le projet « ${label} » et toutes ses tâches ?`)) {
              void onDeleteProject(menu.projectId);
            }
          },
        },
      ]
    : [];

  const groupName = (id: string | null) => groups.find((group) => group.id === id)?.name;

  return (
    <section className="mapping-panel dashboard">
      <div className="dashboard-top-actions">
        <h2>Mes projets</h2>
        <button type="button" className="btn btn-secondary" onClick={onManageGroups}>
          Gérer les équipes
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="muted">Vous n&apos;avez pas encore créé de projet.</p>
      ) : (
        <>
          <p className="muted task-list-hint">Clic droit sur un projet pour le supprimer.</p>
          <ul className="project-list">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  className="btn btn-secondary project-open-btn"
                  onClick={() => onOpenProject(project.id)}
                  onContextMenu={(event) => openProjectMenu(event, project.id)}
                >
                  <span>
                    {project.name}
                    {project.groupId && (
                      <span className="project-team-badge">{groupName(project.groupId)}</span>
                    )}
                  </span>
                  <span className="project-meta">
                    {project.tasks.length} tâche{project.tasks.length > 1 ? "s" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <hr className="dashboard-divider" />

      {showCreateForm ? (
        <form className="create-project-form" onSubmit={handleCreateSubmit}>
          <label>
            Nom du projet
            <input
              type="text"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Ex. Rénovation bureau"
              autoFocus
            />
          </label>

          <label>
            Équipe assignée (optionnel)
            <select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
              <option value="">Aucune équipe</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>

          {formError && <p className="form-error">{formError}</p>}

          <div className="create-project-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Création…" : "Créer le projet"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setShowCreateForm(false);
                setProjectName("");
                setGroupId("");
                setFormError(null);
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="btn btn-primary dashboard-action"
          onClick={() => setShowCreateForm(true)}
        >
          Créer un nouveau projet
        </button>
      )}

      <p className="dashboard-or">ou</p>

      <button type="button" className="btn btn-secondary" onClick={onImport}>
        Importer un fichier Excel / CSV
      </button>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
      )}
    </section>
  );
}
