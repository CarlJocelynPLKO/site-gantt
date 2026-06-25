import { useRef, useState, type ChangeEvent } from "react";
import type { Project } from "../types/gantt";
import {
  formatFileSize,
  getProjectAssetPublicUrl,
  removeProjectCover,
  removeProjectDocument,
  uploadProjectCover,
  uploadProjectDocument,
} from "../services/projectAssetService";

interface ProjectAssetsPanelProps {
  project: Project;
  disabled?: boolean;
  onProjectChange: (project: Project) => void;
  onError?: (message: string) => void;
}

export function ProjectAssetsPanel({
  project,
  disabled = false,
  onProjectChange,
  onError,
}: ProjectAssetsPanelProps) {
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const coverUrl = getProjectAssetPublicUrl(project.coverImagePath);
  const documents = project.documents ?? [];

  const runAssetAction = async (action: () => Promise<Project>) => {
    setUploading(true);
    try {
      const updated = await action();
      onProjectChange(updated);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Impossible de gérer le fichier.");
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    void runAssetAction(() => uploadProjectCover(project.id, file));
  };

  const handleDocumentSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    void runAssetAction(() => uploadProjectDocument(project.id, file));
  };

  return (
    <section className="task-dashboard-assets" aria-labelledby="task-assets-title">
      <h3 id="task-assets-title" className="visually-hidden">
        Image et documents du projet
      </h3>

      <div className="task-assets-grid">
        <div className="task-assets-image">
          {coverUrl ? (
            <div className="task-assets-image-preview">
              <img src={coverUrl} alt={`Visuel du projet ${project.name}`} />
              <div className="task-assets-image-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={disabled || uploading}
                  onClick={() => imageInputRef.current?.click()}
                >
                  Remplacer
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={disabled || uploading}
                  onClick={() => void runAssetAction(() => removeProjectCover(project.id))}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="task-assets-image-empty"
              disabled={disabled || uploading}
              onClick={() => imageInputRef.current?.click()}
            >
              <span className="task-assets-image-empty-icon">+</span>
              <span>Ajouter une image du projet</span>
              <span className="muted">JPG, PNG, WebP ou GIF — 8 Mo max</span>
            </button>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="visually-hidden"
            onChange={handleImageSelect}
          />
        </div>

        <div className="task-assets-docs">
          <div className="task-assets-docs-header">
            <h4>Documents utiles</h4>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={disabled || uploading}
              onClick={() => docInputRef.current?.click()}
            >
              Ajouter un document
            </button>
          </div>

          <input
            ref={docInputRef}
            type="file"
            className="visually-hidden"
            onChange={handleDocumentSelect}
          />

          {documents.length === 0 ? (
            <p className="muted task-assets-docs-empty">
              Plans, briefs, exports PDF, tableurs… (20 Mo max par fichier)
            </p>
          ) : (
            <ul className="task-assets-doc-list">
              {documents.map((doc) => {
                const url = getProjectAssetPublicUrl(doc.path);
                return (
                  <li key={doc.id} className="task-assets-doc-item">
                    <div className="task-assets-doc-info">
                      {url ? (
                        <a href={url} target="_blank" rel="noreferrer" className="task-assets-doc-link">
                          {doc.name}
                        </a>
                      ) : (
                        <span>{doc.name}</span>
                      )}
                      <span className="task-assets-doc-meta">{formatFileSize(doc.size)}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={disabled || uploading}
                      onClick={() =>
                        void runAssetAction(() => removeProjectDocument(project.id, doc.id))
                      }
                      aria-label={`Supprimer ${doc.name}`}
                    >
                      Supprimer
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {uploading && <p className="muted task-assets-uploading">Téléversement en cours…</p>}
    </section>
  );
}
