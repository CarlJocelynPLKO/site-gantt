import { FormEvent, useEffect, useState } from "react";
import type { Project } from "../types/gantt";

interface ProjectDetailsModalProps {
  project: Project | null;
  saving?: boolean;
  onClose: () => void;
  onSaveDescription: (projectId: string, description: string) => Promise<void>;
}

function formatAssignees(project: Project): string {
  if (!project.assignees?.length) {
    return "Aucune affectation";
  }
  return project.assignees.map((person) => `${person.firstName} (${person.jobTitle})`).join(", ");
}

export function ProjectDetailsModal({
  project,
  saving = false,
  onClose,
  onSaveDescription,
}: ProjectDetailsModalProps) {
  const [description, setDescription] = useState("");

  useEffect(() => {
    setDescription(project?.description ?? "");
  }, [project]);

  useEffect(() => {
    if (!project) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [project, onClose]);

  if (!project) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSaveDescription(project.id, description);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-panel task-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h3 id="project-details-title">Détails du projet</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        <dl className="task-details-meta">
          <div>
            <dt>Nom</dt>
            <dd>{project.name}</dd>
          </div>
          <div>
            <dt>Début</dt>
            <dd>{project.start}</dd>
          </div>
          <div>
            <dt>Fin</dt>
            <dd>{project.end}</dd>
          </div>
          <div>
            <dt>Personnes assignées</dt>
            <dd>{formatAssignees(project)}</dd>
          </div>
        </dl>

        <form className="task-details-form" onSubmit={(event) => void handleSubmit(event)}>
          <label htmlFor="project-description">
            Description
            <textarea
              id="project-description"
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ajoutez une note ou un descriptif court pour ce projet…"
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
