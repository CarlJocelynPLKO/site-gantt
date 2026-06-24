import { useEffect, useState } from "react";
import type { ColumnMappingSuggestion, ColumnSelection } from "../types/gantt";
import type { TeamGroup } from "../types/team";

interface ColumnMappingPanelProps {
  mapping: ColumnMappingSuggestion;
  mappingMode: string;
  loading: boolean;
  onGenerate: (selection: ColumnSelection) => void;
  newCalendarName?: string;
  onNewCalendarNameChange?: (name: string) => void;
  showNewCalendarName?: boolean;
  groups?: TeamGroup[];
  newCalendarGroupId?: string;
  onNewCalendarGroupIdChange?: (groupId: string) => void;
}

export function ColumnMappingPanel({
  mapping,
  mappingMode,
  loading,
  onGenerate,
  newCalendarName = "",
  onNewCalendarNameChange,
  showNewCalendarName = false,
  groups = [],
  newCalendarGroupId = "",
  onNewCalendarGroupIdChange,
}: ColumnMappingPanelProps) {
  const [projectColumn, setProjectColumn] = useState("");
  const [startColumn, setStartColumn] = useState("");
  const [endColumn, setEndColumn] = useState("");
  const [durationColumn, setDurationColumn] = useState("");
  const [useDuration, setUseDuration] = useState(false);

  useEffect(() => {
    setProjectColumn(mapping.task_column ?? "");
    setStartColumn(mapping.start_column ?? "");
    setEndColumn(mapping.end_column ?? "");
    setDurationColumn(mapping.duration_column ?? "");
    setUseDuration(Boolean(mapping.duration_column && !mapping.end_column));
  }, [mapping]);

  const canGenerate =
    projectColumn &&
    startColumn &&
    ((useDuration && durationColumn) || (!useDuration && endColumn)) &&
    (!showNewCalendarName || newCalendarName.trim().length > 0);

  return (
    <section className="mapping-panel">
      <div className="mapping-header">
        <h2>Validez le mapping des colonnes</h2>
        <p>
          Mode {mappingMode.toLowerCase()} — confiance {Math.round(mapping.confidence * 100)}%
        </p>
      </div>

      {showNewCalendarName && onNewCalendarNameChange && (
        <>
          <label className="import-project-name-field">
            Nom du nouveau calendrier
            <input
              type="text"
              value={newCalendarName}
              onChange={(event) => onNewCalendarNameChange(event.target.value)}
              placeholder="Ex. Planning chantier"
            />
          </label>
          {onNewCalendarGroupIdChange && (
            <label className="import-project-name-field">
              Équipe assignée (optionnel)
              <select
                value={newCalendarGroupId}
                onChange={(event) => onNewCalendarGroupIdChange(event.target.value)}
              >
                <option value="">Aucune équipe</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </>
      )}

      <div className="mapping-grid">
        <label>
          Projet
          <select value={projectColumn} onChange={(event) => setProjectColumn(event.target.value)}>
            <option value="">Sélectionner…</option>
            {mapping.available_columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </label>

        <label>
          Début
          <select value={startColumn} onChange={(event) => setStartColumn(event.target.value)}>
            <option value="">Sélectionner…</option>
            {mapping.available_columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </label>

        <div className="end-duration-group">
          <div className="toggle-row">
            <label>
              <input
                type="radio"
                name="date-mode"
                checked={!useDuration}
                onChange={() => setUseDuration(false)}
              />
              Date de fin
            </label>
            <label>
              <input
                type="radio"
                name="date-mode"
                checked={useDuration}
                onChange={() => setUseDuration(true)}
              />
              Durée
            </label>
          </div>

          {!useDuration ? (
            <label>
              Fin
              <select value={endColumn} onChange={(event) => setEndColumn(event.target.value)}>
                <option value="">Sélectionner…</option>
                {mapping.available_columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Durée
              <select
                value={durationColumn}
                onChange={(event) => setDurationColumn(event.target.value)}
              >
                <option value="">Sélectionner…</option>
                {mapping.available_columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        disabled={!canGenerate || loading}
        onClick={() =>
          onGenerate({
            projectColumn,
            startColumn,
            endColumn,
            durationColumn,
            useDuration,
          })
        }
      >
        {loading ? "Génération…" : showNewCalendarName ? "Créer le calendrier" : "Générer le Gantt"}
      </button>
    </section>
  );
}
