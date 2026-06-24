import { FormEvent, useState } from "react";

interface ProjectTitleProps {
  name: string;
  saving?: boolean;
  onRename: (name: string) => Promise<void>;
}

export function ProjectTitle({ name, saving = false, onRename }: ProjectTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [error, setError] = useState<string | null>(null);

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
      setError("Le nom du projet ne peut pas être vide.");
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
      <h2 className="gantt-title">{name}</h2>
      <button type="button" className="btn btn-ghost btn-sm" onClick={startEditing}>
        Renommer
      </button>
    </div>
  );
}
