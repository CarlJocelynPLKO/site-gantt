import { useState, type ReactNode } from "react";

interface CollapsiblePanelProps {
  title: string;
  headingLevel?: "h2" | "h3";
  defaultOpen?: boolean;
  className?: string;
  badge?: string;
  children: ReactNode;
}

export function CollapsiblePanel({
  title,
  headingLevel = "h2",
  defaultOpen = true,
  className = "",
  badge,
  children,
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const Heading = headingLevel;

  return (
    <section
      className={`mapping-panel collapsible-panel ${open ? "" : "collapsible-panel--collapsed"} ${className}`.trim()}
    >
      <button
        type="button"
        className="collapsible-panel-header"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Heading className="collapsible-panel-title gantt-title">{title}</Heading>
        <span className="collapsible-panel-meta">
          {badge && <span className="collapsible-panel-badge">{badge}</span>}
          <span className="collapsible-panel-chevron" aria-hidden="true">
            ▾
          </span>
        </span>
      </button>

      {open && <div className="collapsible-panel-body">{children}</div>}
    </section>
  );
}
