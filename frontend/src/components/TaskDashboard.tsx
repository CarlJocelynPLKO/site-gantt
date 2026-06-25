import { useEffect, useMemo, useState } from "react";
import type { Project } from "../types/gantt";
import type { Person } from "../types/team";
import {
  formatReviewDate,
  getProjectNextReviewDate,
  hasProjectReview,
  isReviewTomorrow,
  REVIEW_FREQUENCY_OPTIONS,
} from "../utils/projectReview";
import { AssigneesDropdown } from "./AssigneesDropdown";
import { ProjectAssetsPanel } from "./ProjectAssetsPanel";

interface TaskDashboardProps {
  project: Project;
  people: Person[];
  saving?: boolean;
  onBack: () => void;
  onSave: (
    projectId: string,
    details: {
      description: string;
      assigneeIds: string[];
      reviewFirstDate: string | null;
      reviewFrequencyDays: number | null;
    },
  ) => Promise<void>;
  onProjectChange?: (project: Project) => void;
  onError?: (message: string) => void;
  onDelete?: (projectId: string) => void;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR");
}

function durationDays(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export function TaskDashboard({
  project,
  people,
  saving = false,
  onBack,
  onSave,
  onProjectChange,
  onError,
  onDelete,
}: TaskDashboardProps) {
  const [description, setDescription] = useState(project.description ?? "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    project.assignees?.map((person) => person.id) ?? [],
  );
  const [reviewEnabled, setReviewEnabled] = useState(hasProjectReview(project));
  const [reviewFirstDate, setReviewFirstDate] = useState(project.reviewFirstDate ?? "");
  const [reviewFrequencyDays, setReviewFrequencyDays] = useState(
    String(project.reviewFrequencyDays ?? REVIEW_FREQUENCY_OPTIONS[2].value),
  );
  const [showReviewSettings, setShowReviewSettings] = useState(false);

  useEffect(() => {
    setDescription(project.description ?? "");
    setAssigneeIds(project.assignees?.map((person) => person.id) ?? []);
    setReviewEnabled(hasProjectReview(project));
    setReviewFirstDate(project.reviewFirstDate ?? "");
    setReviewFrequencyDays(String(project.reviewFrequencyDays ?? REVIEW_FREQUENCY_OPTIONS[2].value));
    setShowReviewSettings(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const reviewDraft = useMemo(
    () => ({
      reviewFirstDate: reviewEnabled && reviewFirstDate ? reviewFirstDate : null,
      reviewFrequencyDays:
        reviewEnabled && reviewFirstDate ? Number(reviewFrequencyDays) || null : null,
    }),
    [reviewEnabled, reviewFirstDate, reviewFrequencyDays],
  );

  const nextReviewDate = useMemo(
    () => getProjectNextReviewDate(reviewDraft),
    [reviewDraft],
  );

  const reviewAlertTomorrow = useMemo(
    () => isReviewTomorrow(reviewDraft),
    [reviewDraft],
  );

  const handleSave = async () => {
    await onSave(project.id, {
      description,
      assigneeIds,
      reviewFirstDate: reviewDraft.reviewFirstDate,
      reviewFrequencyDays: reviewDraft.reviewFrequencyDays,
    });
    setShowReviewSettings(false);
  };

  const openReviewSettings = () => {
    setShowReviewSettings(true);
  };

  return (
    <section className="task-dashboard">
      <div className="task-dashboard-bar">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          ← Retour au calendrier
        </button>
        {onDelete && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm(`Supprimer le projet « ${project.name} » ?`)) {
                onDelete(project.id);
              }
            }}
          >
            Supprimer
          </button>
        )}
      </div>

      <header className="task-dashboard-header">
        <h2>{project.name}</h2>
        <ProjectAssetsPanel
          project={project}
          disabled={saving}
          onProjectChange={(updated) => onProjectChange?.(updated)}
          onError={onError}
        />
      </header>

      <dl className="task-details-meta">
        <div>
          <dt>Début</dt>
          <dd>{formatDate(project.start)}</dd>
        </div>
        <div>
          <dt>Fin</dt>
          <dd>{formatDate(project.end)}</dd>
        </div>
        <div>
          <dt>Durée</dt>
          <dd>{durationDays(project.start, project.end)} jour(s)</dd>
        </div>
        <div>
          <dt>Revue de projet</dt>
          <dd className="task-review-meta">
            {nextReviewDate ? (
              <span
                className={
                  reviewAlertTomorrow ? "task-review-next task-review-next--alert" : "task-review-next"
                }
              >
                {formatReviewDate(nextReviewDate)}
                {reviewAlertTomorrow && " (demain)"}
              </span>
            ) : (
              <span className="muted">Non planifiée</span>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={openReviewSettings}>
              {reviewEnabled ? "Modifier" : "Planifier"}
            </button>
          </dd>
        </div>
      </dl>

      <div className="task-dashboard-edit">
        <AssigneesDropdown
          id="task-dashboard-assignees"
          people={people}
          value={assigneeIds}
          onChange={setAssigneeIds}
        />

        <section className="task-dashboard-section" aria-labelledby="task-description-title">
          <h3 id="task-description-title">Description</h3>
          <label className="task-dashboard-field" htmlFor="task-dashboard-description">
            <span className="visually-hidden">Description du projet</span>
            <textarea
              id="task-dashboard-description"
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Notes, descriptif, points clés du projet…"
            />
          </label>
        </section>

        {showReviewSettings && (
          <section className="task-dashboard-section task-review-settings" aria-labelledby="task-review-title">
            <div className="task-review-settings-header">
              <h3 id="task-review-title">Paramètres de la revue</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowReviewSettings(false)}
              >
                Fermer
              </button>
            </div>

            <label className="task-review-toggle">
              <input
                type="checkbox"
                checked={reviewEnabled}
                onChange={(event) => setReviewEnabled(event.target.checked)}
              />
              Activer les revues de projet
            </label>

            {reviewEnabled && (
              <div className="task-review-fields">
                <label htmlFor="task-review-first-date">
                  Première revue
                  <input
                    id="task-review-first-date"
                    type="date"
                    value={reviewFirstDate}
                    onChange={(event) => setReviewFirstDate(event.target.value)}
                    required
                  />
                </label>

                <label htmlFor="task-review-frequency">
                  Fréquence
                  <select
                    id="task-review-frequency"
                    value={reviewFrequencyDays}
                    onChange={(event) => setReviewFrequencyDays(event.target.value)}
                  >
                    {REVIEW_FREQUENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {nextReviewDate ? (
                  <p className="task-review-summary">
                    Prochaine revue :{" "}
                    <strong className={reviewAlertTomorrow ? "task-review-next--alert" : undefined}>
                      {formatReviewDate(nextReviewDate)}
                    </strong>
                  </p>
                ) : (
                  <p className="muted task-review-summary">Indiquez la date de la première revue.</p>
                )}
              </div>
            )}
          </section>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void handleSave()}
            disabled={saving || (reviewEnabled && !reviewFirstDate)}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </section>
  );
}
