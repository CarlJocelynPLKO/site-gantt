import { useRef, useState } from "react";
import type { ViewMode } from "frappe-gantt";
import { ColumnMappingPanel } from "./components/ColumnMappingPanel";
import { FileUpload } from "./components/FileUpload";
import { GanttChart } from "./components/GanttChart";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { ZoomControls } from "./components/ZoomControls";
import { ManualProjectForm } from "./components/ManualProjectForm"; // NOUVEL IMPORT
import { analyzeFile, generateGantt } from "./hooks/useGanttApi";
import type { AnalyzeResponse, ColumnSelection, GanttTask } from "./types/gantt";
import { exportChartAsPng, exportChartAsSvg } from "./utils/exportChart";
import "./App.css";

// NOUVELLE ÉTAPE "manual" AJOUTÉE ICI
type AppStep = "upload" | "analyzing" | "mapping" | "gantt" | "manual";

function App() {
  const [step, setStep] = useState<AppStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const chartRef = useRef<HTMLDivElement>(null);

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setStep("analyzing");

    try {
      const result = await analyzeFile(file);
      setAnalysis(result);
      setStep("mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'analyser le fichier.");
      setStep("upload");
    }
  };

  const handleGenerate = async (selection: ColumnSelection) => {
    if (!selectedFile) {
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const result = await generateGantt(selectedFile, selection);
      setTasks(result.tasks);
      setWarnings(result.warnings);
      setStep("gantt");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de générer le diagramme.");
    } finally {
      setGenerating(false);
    }
  };

  // NOUVELLE FONCTION : Que faire quand le formulaire manuel est validé ?
  const handleManualCreate = (newTask: GanttTask) => {
    setTasks([newTask]); // On remplace la liste actuelle par cette unique tâche
    setWarnings([]); 
    setStep("gantt"); // On passe directement au graphique !
  };

  const handleReset = () => {
    setStep("upload");
    setSelectedFile(null);
    setAnalysis(null);
    setTasks([]);
    setWarnings([]);
    setError(null);
  };

  // ... (Code d'export inchangé)
  const handleExportPng = async () => {
    if (!chartRef.current) return;
    try { await exportChartAsPng(chartRef.current); } 
    catch { setError("Export PNG impossible."); }
  };

  const handleExportSvg = () => {
    if (!chartRef.current) return;
    try { exportChartAsSvg(chartRef.current); } 
    catch (err) { setError(err instanceof Error ? err.message : "Export SVG impossible."); }
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="brand">GanttAI</p>
          <p className="brand-subtitle">Générateur automatique de diagrammes de Gantt</p>
        </div>
        {step !== "upload" && (
          <button type="button" className="btn btn-ghost" onClick={handleReset}>
            Nouveau projet
          </button>
        )}
      </header>

      {error && <p className="error-banner">{error}</p>}

      {/* L'ACCUEIL A CHANGÉ : On propose maintenant deux choix */}
      {step === "upload" && (
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '30px' }}>
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ fontSize: '1.1rem', padding: '12px 24px' }}
              onClick={() => setStep("manual")}
            >
              + Créer un projet manuellement
            </button>
            <p style={{ margin: '15px 0', color: '#64748b' }}>OU</p>
          </div>
          <FileUpload onFileSelected={handleFileSelected} />
        </div>
      )}

      {/* AFFICHAGE DU NOUVEAU FORMULAIRE */}
      {step === "manual" && (
        <ManualProjectForm 
          onProjectCreated={handleManualCreate} 
          onCancel={handleReset} 
        />
      )}

      {step === "analyzing" && <LoadingSkeleton />}
      
      {step === "mapping" && analysis && (
        <ColumnMappingPanel
          mapping={analysis.mapping}
          mappingMode={analysis.mapping_mode}
          loading={generating}
          onGenerate={handleGenerate}
        />
      )}

      {step === "gantt" && tasks.length > 0 && (
        <section className="gantt-panel">
          <div className="gantt-toolbar">
            <ZoomControls viewMode={viewMode} onChange={setViewMode} />
            <div className="export-actions">
              <button type="button" className="btn btn-secondary" onClick={handleExportPng}>
                Exporter PNG
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleExportSvg}>
                Exporter SVG
              </button>
            </div>
          </div>

          {warnings.length > 0 && (
            <ul className="warning-list">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}

          <GanttChart tasks={tasks} viewMode={viewMode} />
        </section>
      )}
    </main>
  );
}

export default App;