import { useRef, useState } from "react";
import type { ViewMode } from "frappe-gantt";
import { AppHeader } from "./components/AppHeader";
import { ColumnMappingPanel } from "./components/ColumnMappingPanel";
import { Dashboard } from "./components/Dashboard";
import { FileUpload } from "./components/FileUpload";
import { GanttPanel } from "./components/GanttPanel";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { ManualTaskForm } from "./components/ManualTaskForm";
import { TaskList } from "./components/TaskList";
import { analyzeFile, generateGantt } from "./hooks/useGanttApi";
import { useProjects } from "./hooks/useProjects";
import type { AppStep } from "./types/app";
import type { AnalyzeResponse, ColumnSelection } from "./types/gantt";
import { exportChartAsPng, exportChartAsSvg } from "./utils/exportChart";
import { fileNameToProjectName } from "./utils/fileNameToProjectName";

export function AppWithProjects() {
  const {
    projects,
    loading,
    saving,
    error: projectsError,
    createProject,
    renameProject,
    deleteProject,
    addTaskToProject,
    appendTasksToProject,
    deleteTaskFromProject,
    getProjectById,
  } = useProjects();

  const [step, setStep] = useState<AppStep>("dashboard");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [importTargetProjectId, setImportTargetProjectId] = useState<string | null>(null);
  const [importAsNewProject, setImportAsNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("Week");

  const ganttPanelRef = useRef<HTMLElement>(null);

  const activeProject = activeProjectId ? getProjectById(activeProjectId) : undefined;
  const projectTasks = activeProject?.tasks ?? [];
  const displayError = error ?? projectsError;

  const resetImportState = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setImportTargetProjectId(null);
    setImportAsNewProject(false);
    setNewProjectName("");
  };

  const goToDashboard = () => {
    setStep("dashboard");
    setActiveProjectId(null);
    resetImportState();
    setError(null);
  };

  const handleCreateProject = async (name: string) => {
    try {
      const project = await createProject(name);
      setActiveProjectId(project.id);
      setStep("project");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le projet.");
    }
  };

  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setStep("project");
    setError(null);
    resetImportState();
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      if (activeProjectId === projectId) {
        goToDashboard();
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer le projet.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!activeProjectId) {
      return;
    }

    try {
      await deleteTaskFromProject(activeProjectId, taskId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer la tâche.");
    }
  };

  const handleAddManualTask = async (taskInput: { name: string; start: string; end: string }) => {
    if (!activeProjectId) {
      return;
    }

    try {
      await addTaskToProject(activeProjectId, {
        name: taskInput.name,
        start: taskInput.start,
        end: taskInput.end,
        progress: 0,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'ajouter la tâche.");
    }
  };

  const handleRenameProject = async (name: string) => {
    if (!activeProjectId) {
      return;
    }

    try {
      await renameProject(activeProjectId, name);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de renommer le projet.");
    }
  };

  const startImport = (targetProjectId: string | null) => {
    setImportTargetProjectId(targetProjectId);
    setImportAsNewProject(targetProjectId === null);
    setNewProjectName("");
    setStep("upload");
    setError(null);
  };

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setError(null);

    if (importAsNewProject) {
      setNewProjectName(fileNameToProjectName(file.name));
    }

    setStep("analyzing");

    try {
      const result = await analyzeFile(file);
      setAnalysis(result);
      setStep("mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'analyser le fichier.");
      if (importTargetProjectId) {
        setStep("project");
      } else {
        setStep("upload");
      }
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

      if (importTargetProjectId) {
        await appendTasksToProject(importTargetProjectId, result.tasks);
        setActiveProjectId(importTargetProjectId);
        setStep("project");
        resetImportState();
      } else if (importAsNewProject) {
        const projectName =
          newProjectName.trim() || fileNameToProjectName(selectedFile.name);
        const project = await createProject(projectName);
        await appendTasksToProject(project.id, result.tasks);
        setActiveProjectId(project.id);
        setStep("project");
        resetImportState();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de générer le diagramme.");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPng = async () => {
    if (!ganttPanelRef.current) {
      return;
    }

    try {
      await exportChartAsPng(ganttPanelRef.current);
    } catch {
      setError("Export PNG impossible.");
    }
  };

  const handleExportSvg = () => {
    if (!ganttPanelRef.current) {
      return;
    }

    try {
      exportChartAsSvg(ganttPanelRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export SVG impossible.");
    }
  };

  const showBackButton = step !== "dashboard";

  return (
    <main className="app-shell">
      <AppHeader showBack={showBackButton} onBack={goToDashboard} />

      {displayError && <p className="error-banner">{displayError}</p>}

      {step === "dashboard" && loading && <LoadingSkeleton />}

      {step === "dashboard" && !loading && (
        <Dashboard
          projects={projects}
          saving={saving}
          onCreateProject={handleCreateProject}
          onOpenProject={handleOpenProject}
          onDeleteProject={handleDeleteProject}
          onImport={() => startImport(null)}
        />
      )}

      {step === "project" && activeProjectId && !activeProject && <LoadingSkeleton />}

      {step === "project" && activeProject && (
        <>
          <ManualTaskForm onAddTask={handleAddManualTask} saving={saving} />
          <TaskList tasks={projectTasks} onDeleteTask={handleDeleteTask} />
          <GanttPanel
            panelRef={ganttPanelRef}
            projectName={activeProject.name}
            onRenameProject={handleRenameProject}
            saving={saving}
            tasks={projectTasks}
            warnings={[]}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onExportPng={handleExportPng}
            onExportSvg={handleExportSvg}
            showManualEntry={false}
            onImport={() => startImport(activeProject.id)}
          />
        </>
      )}

      {step === "upload" && <FileUpload onFileSelected={handleFileSelected} />}
      {step === "analyzing" && <LoadingSkeleton />}
      {step === "mapping" && analysis && (
        <ColumnMappingPanel
          mapping={analysis.mapping}
          mappingMode={analysis.mapping_mode}
          loading={generating}
          onGenerate={handleGenerate}
          showNewProjectName={importAsNewProject}
          newProjectName={newProjectName}
          onNewProjectNameChange={setNewProjectName}
        />
      )}
    </main>
  );
}
