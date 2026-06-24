import type { Person } from "../types/team";
import type { ProjectFilters } from "../utils/projectFilters";

interface GanttFiltersProps {
  people: Person[];
  jobTitles: string[];
  filters: ProjectFilters;
  onChange: (filters: ProjectFilters) => void;
  onReset: () => void;
}

export function GanttFilters({ people, jobTitles, filters, onChange, onReset }: GanttFiltersProps) {
  const hasActiveFilters = Boolean(filters.personId || filters.jobTitle);

  return (
    <div className="gantt-filters">
      <label>
        Personne
        <select
          value={filters.personId}
          onChange={(event) => onChange({ ...filters, personId: event.target.value })}
        >
          <option value="">Toutes les personnes</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.firstName} ({person.jobTitle})
            </option>
          ))}
        </select>
      </label>

      <label>
        Corps de métier
        <select
          value={filters.jobTitle}
          onChange={(event) => onChange({ ...filters, jobTitle: event.target.value })}
        >
          <option value="">Tous les métiers</option>
          {jobTitles.map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={onReset}
        disabled={!hasActiveFilters}
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}
