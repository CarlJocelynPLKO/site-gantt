import { FormEvent, useState, type MouseEvent } from "react";
import type { Calendar, TeamGroup } from "../types/app";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";

interface DashboardProps {
  calendars: Calendar[];
  groups: TeamGroup[];
  saving?: boolean;
  onCreateCalendar: (name: string, groupId: string | null) => Promise<void>;
  onOpenCalendar: (calendarId: string) => void;
  onDeleteCalendar: (calendarId: string) => Promise<void>;
  onImport: () => void;
  onManageGroups: () => void;
}

export function Dashboard({
  calendars,
  groups,
  saving = false,
  onCreateCalendar,
  onOpenCalendar,
  onDeleteCalendar,
  onImport,
  onManageGroups,
}: DashboardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [calendarName, setCalendarName] = useState("");
  const [groupId, setGroupId] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; calendarId: string } | null>(null);

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!calendarName.trim()) {
      setFormError("Veuillez saisir un nom de calendrier.");
      return;
    }

    try {
      await onCreateCalendar(calendarName.trim(), groupId || null);
      setCalendarName("");
      setGroupId("");
      setShowCreateForm(false);
    } catch {
      // L'erreur est affichée par App via la bannière.
    }
  };

  const openCalendarMenu = (event: MouseEvent, calendarId: string) => {
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY, calendarId });
  };

  const menuItems: ContextMenuItem[] = menu
    ? [
        {
          label: "Supprimer le calendrier",
          danger: true,
          onClick: () => {
            const calendar = calendars.find((item) => item.id === menu.calendarId);
            const label = calendar?.name ?? "ce calendrier";
            if (window.confirm(`Supprimer le calendrier « ${label} » et tous ses projets ?`)) {
              void onDeleteCalendar(menu.calendarId);
            }
          },
        },
      ]
    : [];

  const groupName = (id: string | null) => groups.find((group) => group.id === id)?.name;

  return (
    <section className="mapping-panel dashboard">
      <div className="dashboard-top-actions">
        <h2>Mes calendriers</h2>
        <button type="button" className="btn btn-secondary" onClick={onManageGroups}>
          Gérer les équipes
        </button>
      </div>

      {calendars.length === 0 ? (
        <p className="muted">Vous n&apos;avez pas encore créé de calendrier.</p>
      ) : (
        <ul className="project-list">
          {calendars.map((calendar) => (
            <li key={calendar.id}>
              <button
                type="button"
                className="btn btn-secondary project-open-btn"
                onClick={() => onOpenCalendar(calendar.id)}
                onContextMenu={(event) => openCalendarMenu(event, calendar.id)}
              >
                <span>
                  {calendar.name}
                  {calendar.groupId && (
                    <span className="project-team-badge">{groupName(calendar.groupId)}</span>
                  )}
                </span>
                <span className="project-meta">
                  {calendar.projects.length} projet{calendar.projects.length > 1 ? "s" : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <hr className="dashboard-divider" />

      {showCreateForm ? (
        <form className="create-project-form" onSubmit={handleCreateSubmit}>
          <label>
            Nom du calendrier
            <input
              type="text"
              value={calendarName}
              onChange={(event) => setCalendarName(event.target.value)}
              placeholder="Ex. Rénovation bureau"
              autoFocus
            />
          </label>

          <label>
            Équipe assignée (optionnel)
            <select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
              <option value="">Aucune équipe</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>

          {formError && <p className="form-error">{formError}</p>}

          <div className="create-project-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Création…" : "Créer le calendrier"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setShowCreateForm(false);
                setCalendarName("");
                setGroupId("");
                setFormError(null);
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="btn btn-primary dashboard-action"
          onClick={() => setShowCreateForm(true)}
        >
          Créer un nouveau calendrier
        </button>
      )}

      <p className="dashboard-or">ou</p>

      <button type="button" className="btn btn-secondary" onClick={onImport}>
        Importer un fichier Excel / CSV
      </button>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
      )}
    </section>
  );
}
