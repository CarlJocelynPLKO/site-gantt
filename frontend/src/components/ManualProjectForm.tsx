import { useState } from "react";
import type { GanttTask } from "../types/gantt";

interface ManualProjectFormProps {
  onProjectCreated: (task: GanttTask) => void;
  onCancel: () => void;
}

export function ManualProjectForm({ onProjectCreated, onCancel }: ManualProjectFormProps) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validation de base
    if (!name.trim() || !start || !end) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    // 2. Vérification de la cohérence des dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate < startDate) {
      setError("La date de fin ne peut pas être antérieure à la date de début.");
      return;
    }

    // 3. Création de l'objet GanttTask
    const newTask: GanttTask = {
      id: `task_${Date.now()}`, // Identifiant unique basé sur l'heure
      name: name.trim(),
      start: start,
      end: end,
      progress: 0, // Par défaut à 0%
    };

    onProjectCreated(newTask);
  };

  return (
    <div className="mapping-panel">
      <h2>Créer un projet manuellement</h2>
      <p>Saisissez les informations de base de votre nouvelle tâche.</p>
      
      {error && <p className="error-banner">{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Nom de la tâche :</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Refonte du site web"
            style={{ padding: '8px', width: '100%', maxWidth: '400px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Date de début :</label>
          <input 
            type="date" 
            value={start}
            onChange={(e) => setStart(e.target.value)}
            style={{ padding: '8px', width: '100%', maxWidth: '200px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Date de fin :</label>
          <input 
            type="date" 
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            style={{ padding: '8px', width: '100%', maxWidth: '200px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button type="submit" className="btn btn-primary">
            Créer et afficher le Gantt
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}