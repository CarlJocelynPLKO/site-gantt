interface AppHeaderProps {
  showBack: boolean;
  onBack: () => void;
  userEmail?: string | null;
  onSignOut?: () => void;
  compact?: boolean;
}

export function AppHeader({
  showBack,
  onBack,
  userEmail,
  onSignOut,
  compact = false,
}: AppHeaderProps) {
  return (
    <header className={`app-header${compact ? " app-header--compact" : ""}`}>
      <div>
        <p className="brand">GanttAI</p>
        <p className="brand-subtitle">Générateur automatique de diagrammes de Gantt</p>
        {userEmail && <p className="user-email">{userEmail}</p>}
      </div>
      <div className="header-actions">
        {showBack && (
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Retour au tableau de bord
          </button>
        )}
        {onSignOut && (
          <button type="button" className="btn btn-ghost" onClick={onSignOut}>
            Déconnexion
          </button>
        )}
      </div>
    </header>
  );
}
