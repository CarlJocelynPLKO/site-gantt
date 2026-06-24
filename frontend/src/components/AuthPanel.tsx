import { FormEvent, useState } from "react";

interface AuthPanelProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}

export function AuthPanel({ onSignIn, onSignUp }: AuthPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        await onSignIn(email.trim(), password);
      } else {
        await onSignUp(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mapping-panel auth-panel">
      <h2>Connexion requise</h2>
      <p className="muted">
        Connectez-vous pour gérer vos projets, équipes et affectations (sécurité Supabase par
        utilisateur).
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Connexion…" : mode === "signin" ? "Se connecter" : "Créer un compte"}
        </button>
      </form>

      <button
        type="button"
        className="btn btn-ghost auth-toggle"
        onClick={() => setMode((current) => (current === "signin" ? "signup" : "signin"))}
      >
        {mode === "signin"
          ? "Pas de compte ? Créer un compte"
          : "Déjà un compte ? Se connecter"}
      </button>
    </section>
  );
}
