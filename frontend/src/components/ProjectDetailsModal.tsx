import { FormEvent, useEffect, useState } from "react";
import type { Project } from "../types/gantt";
import type { Person } from "../types/team";
import { AssigneesDropdown } from "./AssigneesDropdown";

interface ProjectDetailsModalProps {
  project: Project | null;
  people: Person[];
  saving?: boolean;
  onClose: () => void;
  onSave: (
    projectId: string,
    details: { description: string; assigneeIds: string[] },
  ) => Promise<void>;
}

export function ProjectDetailsModal({
  project,
  people,
  saving = false,
  onClose,
  onSave,
}: ProjectDetailsModalProps) {
  const [description, setDescription] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  useEffect(() => {
    setDescription(project?.description ?? "");
    setAssigneeIds(project?.assignees?.map((person) => person.id) ?? []);
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
    await onSave(project.id, { description, assigneeIds });
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
        </dl>

        <form className="task-details-form" onSubmit={(event) => void handleSubmit(event)}>
          <AssigneesDropdown
            id="project-details-assignees"
            people={people}
            value={assigneeIds}
            onChange={setAssigneeIds}
          />

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
