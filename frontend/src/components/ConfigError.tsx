export function ConfigError() {
  return (
    <section className="mapping-panel config-error">
      <h2>Configuration Supabase manquante</h2>
      <p className="muted">
        L&apos;application ne peut pas démarrer car les variables d&apos;environnement ne sont pas
        complètes.
      </p>
      <ol className="config-steps">
        <li>
          Ouvrez le fichier <code>frontend/.env</code>
        </li>
        <li>
          <code>VITE_SUPABASE_URL</code> doit être l&apos;URL du projet uniquement, par exemple{" "}
          <code>https://votre-projet.supabase.co</code> (sans <code>/rest/v1/</code>)
        </li>
        <li>
          Renseignez <code>VITE_SUPABASE_ANON_KEY</code> avec la clé <strong>anon</strong> ou{" "}
          <strong>publishable</strong> (Supabase → Project Settings → API)
        </li>
        <li>Redémarrez le serveur : <code>npm run dev</code></li>
      </ol>
      <p className="config-example">
        Exemple :
        <br />
        <code>VITE_SUPABASE_URL=https://votre-projet.supabase.co</code>
        <br />
        <code>VITE_SUPABASE_ANON_KEY=eyJhbGciOi...</code>
      </p>
    </section>
  );
}
