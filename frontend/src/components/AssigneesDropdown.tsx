import { useEffect, useRef, useState } from "react";
import type { Person } from "../types/team";

interface AssigneesDropdownProps {
  id: string;
  label?: string;
  people: Person[];
  value: string[];
  onChange: (assigneeIds: string[]) => void;
  emptyMessage?: string;
}

function formatSelection(people: Person[], value: string[]): string {
  if (value.length === 0) {
    return "Aucune personne sélectionnée";
  }

  const labels = people
    .filter((person) => value.includes(person.id))
    .map((person) => `${person.firstName} (${person.jobTitle})`);

  if (labels.length <= 2) {
    return labels.join(", ");
  }

  return `${labels.length} personnes sélectionnées`;
}

export function AssigneesDropdown({
  id,
  label = "Personnes affectées",
  people,
  value,
  onChange,
  emptyMessage = "Assignez une équipe au calendrier pour affecter des personnes.",
}: AssigneesDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const togglePerson = (personId: string) => {
    onChange(
      value.includes(personId)
        ? value.filter((id) => id !== personId)
        : [...value, personId],
    );
  };

  if (people.length === 0) {
    return <p className="muted">{emptyMessage}</p>;
  }

  return (
    <div className="assignees-dropdown" ref={containerRef}>
      <label htmlFor={id}>{label}</label>
      <button
        id={id}
        type="button"
        className="assignees-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="assignees-dropdown-value">{formatSelection(people, value)}</span>
        <span className="assignees-dropdown-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="assignees-dropdown-menu" role="listbox" aria-multiselectable="true">
          {people.map((person) => (
            <label key={person.id} className="assignees-dropdown-option">
              <input
                type="checkbox"
                checked={value.includes(person.id)}
                onChange={() => togglePerson(person.id)}
              />
              <span>
                {person.firstName} — {person.jobTitle}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
