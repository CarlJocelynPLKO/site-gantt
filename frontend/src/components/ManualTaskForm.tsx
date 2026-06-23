import { FormEvent, useState } from "react";

interface ManualTaskFormProps {
  onAddTask: (task: { name: string; start: string; end: string }) => Promise<void>;
  saving?: boolean;
}

export function ManualTaskForm({ onAddTask, saving = false }: ManualTaskFormProps) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

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

    try {
      await onAddTask({ name: name.trim(), start, end });
      setName("");
      setStart("");
      setEnd("");
    } catch {
      // L'erreur est affichée par App via la bannière.
    }
  };

  return (
    <section className="mapping-panel task-form-panel">
      <h2>Ajouter une tâche</h2>
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

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Enregistrement…" : "Ajouter la tâche"}
        </button>
      </form>
    </section>
  );
}
