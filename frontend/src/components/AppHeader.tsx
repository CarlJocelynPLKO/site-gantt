interface AppHeaderProps {
  showBack: boolean;
  onBack: () => void;
}

export function AppHeader({ showBack, onBack }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div>
        <p className="brand">GanttAI</p>
        <p className="brand-subtitle">Générateur automatique de diagrammes de Gantt</p>
      </div>
      {showBack && (
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Retour au tableau de bord
        </button>
      )}
    </header>
  );
}
