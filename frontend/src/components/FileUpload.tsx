import { useRef, useState } from "react";
import { isSupportedFile } from "../types/gantt";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileSelected, disabled = false }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!isSupportedFile(file)) {
      setError("Format non supporté. Utilisez .xlsx, .xls, .csv, .tsv ou .ods.");
      return;
    }

    setError(null);
    onFileSelected(file);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (disabled) {
      return;
    }
    handleFile(event.dataTransfer.files[0]);
  };

  return (
    <section className="upload-section">
      <h1>Visualisez votre calendrier en un clic</h1>
      <p className="subtitle">
        Importez un fichier Excel ou CSV. GanttAI détecte automatiquement vos colonnes.
      </p>

      <div
        className={`dropzone ${dragActive ? "dropzone-active" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setDragActive(true);
          }
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            inputRef.current?.click();
          }
        }}
      >
        <p className="dropzone-title">Glissez-déposez votre fichier ici</p>
        <p className="dropzone-hint">Formats acceptés : .xlsx, .xls, .csv, .tsv, .ods</p>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Parcourir les fichiers
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.tsv,.ods"
          hidden
          disabled={disabled}
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>

      {error && <p className="error-banner">{error}</p>}
    </section>
  );
}
