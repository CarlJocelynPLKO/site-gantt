import { isSupabaseConfigured } from "./supabaseClient";
import { AppHeader } from "./components/AppHeader";
import { ConfigError } from "./components/ConfigError";
import { AppWithProjects } from "./AppWithProjects";
import "./App.css";

function App() {
  if (!isSupabaseConfigured) {
    return (
      <main className="app-shell">
        <AppHeader showBack={false} onBack={() => undefined} />
        <ConfigError />
      </main>
    );
  }

  return <AppWithProjects />;
}

export default App;
