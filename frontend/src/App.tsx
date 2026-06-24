import { isSupabaseConfigured } from "./supabaseClient";
import { AppHeader } from "./components/AppHeader";
import { ConfigError } from "./components/ConfigError";
import { AppWithCalendars } from "./AppWithCalendars";
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

  return <AppWithCalendars />;
}

export default App;
