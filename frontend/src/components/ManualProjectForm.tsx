import { FormEvent, useEffect, useState } from "react";
import type { Project } from "../types/gantt";
import type { Person } from "../types/team";

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

  const toggleAssignee = (personId: string) => {
    setAssigneeIds((current) =>
      current.includes(personId)
        ? current.filter((id) => id !== personId)
        : [...current, personId],
    );
  };

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
    <section className="mapping-panel task-form-panel">
      <h2>{isEditing ? "Modifier le projet" : "Ajouter un projet"}</h2>
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

        {people.length > 0 && (
          <fieldset className="assignees-fieldset">
            <legend>Personnes affectées</legend>
            <div className="assignees-list">
              {people.map((person) => (
                <label key={person.id} className="assignee-option">
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(person.id)}
                    onChange={() => toggleAssignee(person.id)}
                  />
                  {person.firstName} — {person.jobTitle}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {people.length === 0 && (
          <p className="muted">Assignez une équipe au calendrier pour affecter des personnes.</p>
        )}

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
    </section>
  );
}
