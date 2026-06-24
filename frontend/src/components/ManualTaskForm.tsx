import { FormEvent, useEffect, useState } from "react";
import type { GanttTask } from "../types/gantt";
import type { Person } from "../types/team";

interface ManualTaskFormProps {
  people: Person[];
  editingTask?: GanttTask | null;
  onAddTask: (task: {
    name: string;
    start: string;
    end: string;
    assigneeIds: string[];
  }) => Promise<void>;
  onUpdateTask?: (
    taskId: string,
    task: { name: string; start: string; end: string; assigneeIds: string[] },
  ) => Promise<void>;
  onCancelEdit?: () => void;
  saving?: boolean;
}

export function ManualTaskForm({
  people,
  editingTask = null,
  onAddTask,
  onUpdateTask,
  onCancelEdit,
  saving = false,
}: ManualTaskFormProps) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(editingTask);

  useEffect(() => {
    if (editingTask) {
      setName(editingTask.name);
      setStart(editingTask.start);
      setEnd(editingTask.end);
      setAssigneeIds(editingTask.assignees?.map((person) => person.id) ?? []);
    } else {
      setName("");
      setStart("");
      setEnd("");
      setAssigneeIds([]);
    }
    setError(null);
  }, [editingTask]);

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
      setError("Le nom de la tâche est obligatoire.");
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
      if (isEditing && editingTask && onUpdateTask) {
        await onUpdateTask(editingTask.id, payload);
        onCancelEdit?.();
      } else {
        await onAddTask(payload);
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
      <h2>{isEditing ? "Modifier la tâche" : "Ajouter une tâche"}</h2>
      <form className="task-form" onSubmit={handleSubmit}>
        <label>
          Nom de la tâche
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
          <p className="muted">Assignez une équipe au projet pour affecter des personnes.</p>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="create-project-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving
              ? "Enregistrement…"
              : isEditing
                ? "Enregistrer les modifications"
                : "Ajouter la tâche"}
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
