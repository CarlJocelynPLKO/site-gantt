import { FormEvent, useEffect, useState } from "react";

interface CalendarTitleProps {
  name: string;
  saving?: boolean;
  onRename: (name: string) => Promise<void>;
}

export function CalendarTitle({ name, saving = false, onRename }: CalendarTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraftName(name);
    }
  }, [name, isEditing]);

  const startEditing = () => {
    setDraftName(name);
    setError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraftName(name);
    setError(null);
    setIsEditing(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!draftName.trim()) {
      setError("Le nom du calendrier ne peut pas être vide.");
      return;
    }

    if (draftName.trim() === name) {
      setIsEditing(false);
      return;
    }

    try {
      await onRename(draftName.trim());
      setIsEditing(false);
    } catch {
      // L'erreur est affichée par App via la bannière.
    }
  };

  if (isEditing) {
    return (
      <form className="project-title-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          autoFocus
          disabled={saving}
        />
        <div className="project-title-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={cancelEditing} disabled={saving}>
            Annuler
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}
      </form>
    );
  }

  return (
    <div className="project-title-row">
      <button
        type="button"
        className="gantt-title project-title-button"
        onClick={startEditing}
        title="Cliquer pour renommer"
      >
        {name}
      </button>
    </div>
  );
}
