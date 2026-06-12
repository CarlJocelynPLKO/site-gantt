import { useEffect, useState } from "react";
import type { ColumnMappingSuggestion, ColumnSelection } from "../types/gantt";

interface ColumnMappingPanelProps {
  mapping: ColumnMappingSuggestion;
  mappingMode: string;
  loading: boolean;
  onGenerate: (selection: ColumnSelection) => void;
}

export function ColumnMappingPanel({
  mapping,
  mappingMode,
  loading,
  onGenerate,
}: ColumnMappingPanelProps) {
  const [taskColumn, setTaskColumn] = useState("");
  const [startColumn, setStartColumn] = useState("");
  const [endColumn, setEndColumn] = useState("");
  const [durationColumn, setDurationColumn] = useState("");
  const [useDuration, setUseDuration] = useState(false);

  useEffect(() => {
    setTaskColumn(mapping.task_column ?? "");
    setStartColumn(mapping.start_column ?? "");
    setEndColumn(mapping.end_column ?? "");
    setDurationColumn(mapping.duration_column ?? "");
    setUseDuration(Boolean(mapping.duration_column && !mapping.end_column));
  }, [mapping]);

  const canGenerate =
    taskColumn &&
    startColumn &&
    ((useDuration && durationColumn) || (!useDuration && endColumn));

  return (
    <section className="mapping-panel">
      <div className="mapping-header">
        <h2>Validez le mapping des colonnes</h2>
        <p>
          Mode {mappingMode.toLowerCase()} — confiance {Math.round(mapping.confidence * 100)}%
        </p>
      </div>

      <div className="mapping-grid">
        <label>
          Tâche
          <select value={taskColumn} onChange={(event) => setTaskColumn(event.target.value)}>
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
            taskColumn,
            startColumn,
            endColumn,
            durationColumn,
            useDuration,
          })
        }
      >
        {loading ? "Génération…" : "Générer le Gantt"}
      </button>
    </section>
  );
}
