import { FormEvent, useState } from "react";
import type { Project } from "../types/app";

interface DashboardProps {
  projects: Project[];
  saving?: boolean;
  onCreateProject: (name: string) => Promise<void>;
  onOpenProject: (projectId: string) => void;
  onImport: () => void;
}

export function Dashboard({
  projects,
  saving = false,
  onCreateProject,
  onOpenProject,
  onImport,
}: DashboardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!projectName.trim()) {
      setFormError("Veuillez saisir un nom de projet.");
      return;
    }

    try {
      await onCreateProject(projectName.trim());
      setProjectName("");
      setShowCreateForm(false);
    } catch {
      // L'erreur est affichée par App via la bannière.
    }
  };

  return (
    <section className="mapping-panel dashboard">
      <h2>Mes projets</h2>

      {projects.length === 0 ? (
        <p className="muted">Vous n&apos;avez pas encore créé de projet.</p>
      ) : (
        <ul className="project-list">
          {projects.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                className="btn btn-secondary project-open-btn"
                onClick={() => onOpenProject(project.id)}
              >
                {project.name}
                <span className="project-meta">
                  {project.tasks.length} tâche{project.tasks.length > 1 ? "s" : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
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
    </section>
  );
}
