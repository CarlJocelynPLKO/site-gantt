import { FormEvent, useEffect, useState } from "react";
import type { Project } from "../types/gantt";
import type { Person } from "../types/team";
import { AssigneesDropdown } from "./AssigneesDropdown";
import { CollapsiblePanel } from "./CollapsiblePanel";

interface ManualProjectFormProps {
  people: Person[];
  editingProject?: Project | null;
  onAddProject: (project: {
    name: string;
    start: string;
    end: string;
    assigneeIds: string[];
  }) => Promise<void>;
  onUpdateProject?: (
    projectId: string,
    project: { name: string; start: string; end: string; assigneeIds: string[] },
  ) => Promise<void>;
  onCancelEdit?: () => void;
  saving?: boolean;
}

export function ManualProjectForm({
  people,
  editingProject = null,
  onAddProject,
  onUpdateProject,
  onCancelEdit,
  saving = false,
}: ManualProjectFormProps) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(editingProject);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setStart(editingProject.start);
      setEnd(editingProject.end);
      setAssigneeIds(editingProject.assignees?.map((person) => person.id) ?? []);
    } else {
      setName("");
      setStart("");
      setEnd("");
      setAssigneeIds([]);
    }
    setError(null);
  }, [editingProject]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Le nom du projet est obligatoire.");
      return;
    }

    if (!start || !end) {
      setError("Les dates de début et de fin sont obligatoires.");
      return;
    }

    if (new Date(end) < new Date(start)) {
      setError("La date de fin doit être postérieure ou égale à la date de début.");
      return;
    }

    const payload = {
      name: name.trim(),
      start,
      end,
      assigneeIds,
    };

    try {
      if (isEditing && editingProject && onUpdateProject) {
        await onUpdateProject(editingProject.id, payload);
        onCancelEdit?.();
      } else {
        await onAddProject(payload);
        setName("");
        setStart("");
        setEnd("");
        setAssigneeIds([]);
      }
    } catch {
      // L'erreur est affichée par App via la bannière.
    }
  };

  return (
    <CollapsiblePanel
      title={isEditing ? "Modifier le projet" : "Ajouter un projet"}
      className="task-form-panel"
      defaultOpen
    >
      <form className="task-form" onSubmit={handleSubmit}>
        <label>
          Nom du projet
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex. Étude préliminaire"
          />
        </label>

        <label>
          Date de début
          <input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
        </label>

        <label>
          Date de fin
          <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
        </label>

        <AssigneesDropdown
          id="manual-project-assignees"
          people={people}
          value={assigneeIds}
          onChange={setAssigneeIds}
        />

        {error && <p className="form-error">{error}</p>}

        <div className="create-project-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving
              ? "Enregistrement…"
              : isEditing
                ? "Enregistrer les modifications"
                : "Ajouter le projet"}
          </button>
          {isEditing && onCancelEdit && (
            <button type="button" className="btn btn-ghost" onClick={onCancelEdit}>
              Annuler
            </button>
          )}
        </div>
      </form>
    </CollapsiblePanel>
  );
}
