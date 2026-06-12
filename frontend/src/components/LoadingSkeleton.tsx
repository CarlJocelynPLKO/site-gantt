export function LoadingSkeleton() {
  return (
    <section className="loading-panel" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>Analyse du fichier en cours…</p>
      <div className="skeleton-grid">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
        <div className="skeleton-line" />
      </div>
    </section>
  );
}
