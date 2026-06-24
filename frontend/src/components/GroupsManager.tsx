import { FormEvent, useState } from "react";
import type { Person, TeamGroup } from "../types/team";

interface GroupsManagerProps {
  groups: TeamGroup[];
  saving?: boolean;
  onCreateGroup: (name: string) => Promise<void>;
  onAddPerson: (groupId: string, firstName: string, jobTitle: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  onDeletePerson: (groupId: string, personId: string) => Promise<void>;
  onBack: () => void;
}

export function GroupsManager({
  groups,
  saving = false,
  onCreateGroup,
  onAddPerson,
  onDeleteGroup,
  onDeletePerson,
  onBack,
}: GroupsManagerProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  const handleCreateGroup = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!groupName.trim()) {
      setError("Nom d'équipe obligatoire.");
      return;
    }
    try {
      await onCreateGroup(groupName.trim());
      setGroupName("");
    } catch {
      // Erreur affichée par le parent
    }
  };

  const handleAddPerson = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!selectedGroupId) {
      return;
    }
    if (!firstName.trim() || !jobTitle.trim()) {
      setError("Prénom et corps de métier obligatoires.");
      return;
    }
    try {
      await onAddPerson(selectedGroupId, firstName.trim(), jobTitle.trim());
      setFirstName("");
      setJobTitle("");
    } catch {
      // Erreur affichée par le parent
    }
  };

  return (
    <section className="mapping-panel groups-manager">
      <div className="groups-header">
        <h2>Gestion des équipes</h2>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Retour
        </button>
      </div>

      <form className="create-project-form" onSubmit={handleCreateGroup}>
        <label>
          Nouvelle équipe
          <input
            type="text"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Ex. Équipe chantier"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          Créer l&apos;équipe
        </button>
      </form>

      {groups.length === 0 ? (
        <p className="muted">Aucune équipe pour le moment.</p>
      ) : (
        <ul className="group-cards">
          {groups.map((group) => (
            <li key={group.id} className="group-card">
              <div className="group-card-header">
                <button
                  type="button"
                  className={`btn btn-ghost ${selectedGroupId === group.id ? "active" : ""}`}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  {group.name}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm context-menu-item--danger"
                  onClick={() => {
                    if (window.confirm(`Supprimer l'équipe « ${group.name} » ?`)) {
                      void onDeleteGroup(group.id);
                    }
                  }}
                >
                  Supprimer
                </button>
              </div>

              {group.people.length === 0 ? (
                <p className="muted">Aucun membre.</p>
              ) : (
                <ul className="people-list">
                  {group.people.map((person: Person) => (
                    <li key={person.id} className="people-list-item">
                      <span>
                        {person.firstName} — <em>{person.jobTitle}</em>
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => void onDeletePerson(group.id, person.id)}
                      >
                        Retirer
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {selectedGroup && (
        <form className="task-form" onSubmit={handleAddPerson}>
          <h3>Ajouter un membre à « {selectedGroup.name} »</h3>
          <label>
            Prénom
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </label>
          <label>
            Corps de métier
            <input
              type="text"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            Ajouter la personne
          </button>
        </form>
      )}
    </section>
  );
}
