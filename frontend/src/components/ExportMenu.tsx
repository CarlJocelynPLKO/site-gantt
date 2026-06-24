import { useEffect, useRef, useState } from "react";

export type ExportFormat = "png" | "svg" | "pdf";

interface ExportMenuProps {
  disabled?: boolean;
  onExport: (format: ExportFormat) => void;
}

const FORMATS: { format: ExportFormat; label: string }[] = [
  { format: "png", label: "PNG" },
  { format: "svg", label: "SVG" },
  { format: "pdf", label: "PDF" },
];

export function ExportMenu({ disabled = false, onExport }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const handleSelect = (format: ExportFormat) => {
    onExport(format);
    setOpen(false);
  };

  return (
    <div className="export-menu" ref={menuRef}>
      <button
        type="button"
        className="btn btn-secondary export-menu-trigger"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        Exporter
        <span className="export-menu-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="export-menu-dropdown" role="menu">
          {FORMATS.map((item) => (
            <button
              key={item.format}
              type="button"
              role="menuitem"
              className="export-menu-item"
              onClick={() => handleSelect(item.format)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
