export function ConfigError() {
  const isProduction = import.meta.env.PROD;

  return (
    <section className="mapping-panel config-error">
      <h2>Configuration Supabase manquante</h2>
      <p className="muted">
        L&apos;application ne peut pas démarrer car les variables d&apos;environnement ne sont pas
        complètes.
      </p>

      {isProduction ? (
        <ol className="config-steps">
          <li>
            Ouvrez votre projet sur{" "}
            <a href="https://vercel.com" target="_blank" rel="noreferrer">
              vercel.com
            </a>{" "}
            → <strong>Settings</strong> → <strong>Environment Variables</strong>
          </li>
          <li>
            Ajoutez <code>VITE_SUPABASE_URL</code> ={" "}
            <code>https://votre-projet.supabase.co</code> (sans <code>/rest/v1/</code>)
          </li>
          <li>
            Ajoutez <code>VITE_SUPABASE_ANON_KEY</code> = votre clé <strong>anon</strong> ou{" "}
            <strong>publishable</strong> (Supabase → Project Settings → API)
          </li>
          <li>
            Cochez <strong>Production</strong> (et Preview si besoin), puis enregistrez
          </li>
          <li>
            Allez dans <strong>Deployments</strong> → menu <strong>⋯</strong> →{" "}
            <strong>Redeploy</strong> (obligatoire : Vite intègre ces variables au build)
          </li>
        </ol>
      ) : (
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
          <li>
            Redémarrez le serveur : <code>npm run dev</code>
          </li>
        </ol>
      )}

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
