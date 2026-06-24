import { useRef, useState } from "react";
import type { ViewMode } from "frappe-gantt";
import type { GanttTask } from "./types/gantt";
import { AppHeader } from "./components/AppHeader";
import { AuthPanel } from "./components/AuthPanel";
import { ColumnMappingPanel } from "./components/ColumnMappingPanel";
import { Dashboard } from "./components/Dashboard";
import { FileUpload } from "./components/FileUpload";
import { GanttPanel } from "./components/GanttPanel";
import { GroupsManager } from "./components/GroupsManager";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { ManualTaskForm } from "./components/ManualTaskForm";
import { TaskList } from "./components/TaskList";
import { useAuth } from "./hooks/useAuth";
import { analyzeFile, generateGantt } from "./hooks/useGanttApi";
import { useGroups } from "./hooks/useGroups";
import { useProjects } from "./hooks/useProjects";
import type { AppStep } from "./types/app";
import type { AnalyzeResponse, ColumnSelection } from "./types/gantt";
import { exportChartAsPng, exportChartAsSvg } from "./utils/exportChart";
import { fileNameToProjectName } from "./utils/fileNameToProjectName";

export function AppWithProjects() {
  const { user, loading: authLoading, signIn, signUp, signOut, isAuthenticated } = useAuth();

  const {
    projects,
    loading: projectsLoading,
    saving,
    error: projectsError,
    createProject,
    renameProject,
    deleteProject,
    addTaskToProject,
    updateTaskInProject,
    appendTasksToProject,
    deleteTaskFromProject,
    getProjectById,
  } = useProjects(isAuthenticated);

  const {
    groups,
    loading: groupsLoading,
    saving: groupsSaving,
    error: groupsError,
    createTeamGroup,
    removeGroup,
    addPerson,
    removePerson,
    getGroupById,
  } = useGroups(isAuthenticated);

  const [step, setStep] = useState<AppStep>("dashboard");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
  const [importTargetProjectId, setImportTargetProjectId] = useState<string | null>(null);
  const [importAsNewProject, setImportAsNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectGroupId, setNewProjectGroupId] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("Week");

  const ganttPanelRef = useRef<HTMLElement>(null);

  const activeProject = activeProjectId ? getProjectById(activeProjectId) : undefined;
  const projectTasks = activeProject?.tasks ?? [];
  const projectPeople = activeProject?.groupId
    ? (getGroupById(activeProject.groupId)?.people ?? [])
    : [];
  const projectGroupName = activeProject?.groupId
    ? getGroupById(activeProject.groupId)?.name
    : undefined;

  const displayError = error ?? projectsError ?? groupsError;

  const resetImportState = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setImportTargetProjectId(null);
    setImportAsNewProject(false);
    setNewProjectName("");
    setNewProjectGroupId("");
  };

  const goToDashboard = () => {
    setStep("dashboard");
    setActiveProjectId(null);
    setEditingTask(null);
    resetImportState();
    setError(null);
  };

  const handleCreateProject = async (name: string, groupId: string | null) => {
    try {
      const project = await createProject(name, groupId);
      setActiveProjectId(project.id);
      setStep("project");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le projet.");
    }
  };

  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setEditingTask(null);
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
      if (editingTask?.id === taskId) {
        setEditingTask(null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer la tâche.");
    }
  };

  const handleAddManualTask = async (taskInput: {
    name: string;
    start: string;
    end: string;
    assigneeIds: string[];
  }) => {
    if (!activeProjectId) {
      return;
    }
    try {
      await addTaskToProject(activeProjectId, {
        name: taskInput.name,
        start: taskInput.start,
        end: taskInput.end,
        progress: 0,
        assigneeIds: taskInput.assigneeIds,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'ajouter la tâche.");
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    taskInput: { name: string; start: string; end: string; assigneeIds: string[] },
  ) => {
    if (!activeProjectId) {
      return;
    }
    try {
      await updateTaskInProject(activeProjectId, taskId, {
        name: taskInput.name,
        start: taskInput.start,
        end: taskInput.end,
        progress: 0,
        assigneeIds: taskInput.assigneeIds,
      });
      setEditingTask(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de modifier la tâche.");
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
    setNewProjectGroupId("");
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
      setStep(importTargetProjectId ? "project" : "upload");
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
        const project = await createProject(projectName, newProjectGroupId || null);
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

  if (authLoading) {
    return (
      <main className="app-shell">
        <LoadingSkeleton />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="app-shell">
        <AppHeader showBack={false} onBack={() => undefined} />
        <AuthPanel onSignIn={signIn} onSignUp={signUp} />
      </main>
    );
  }

  const showBackButton = step !== "dashboard";

  return (
    <main className="app-shell">
      <AppHeader
        showBack={showBackButton}
        onBack={goToDashboard}
        userEmail={user?.email}
        onSignOut={() => void signOut().then(goToDashboard)}
      />

      {displayError && <p className="error-banner">{displayError}</p>}

      {step === "dashboard" && (projectsLoading || groupsLoading) && <LoadingSkeleton />}

      {step === "dashboard" && !projectsLoading && !groupsLoading && (
        <Dashboard
          projects={projects}
          groups={groups}
          saving={saving}
          onCreateProject={handleCreateProject}
          onOpenProject={handleOpenProject}
          onDeleteProject={handleDeleteProject}
          onImport={() => startImport(null)}
          onManageGroups={() => setStep("groups")}
        />
      )}

      {step === "groups" && (
        <GroupsManager
          groups={groups}
          saving={groupsSaving}
          onCreateGroup={async (name) => {
            await createTeamGroup(name);
          }}
          onAddPerson={async (groupId, firstName, jobTitle) => {
            await addPerson(groupId, firstName, jobTitle);
          }}
          onDeleteGroup={removeGroup}
          onDeletePerson={removePerson}
          onBack={() => setStep("dashboard")}
        />
      )}

      {step === "project" && activeProjectId && !activeProject && <LoadingSkeleton />}

      {step === "project" && activeProject && (
        <>
          <ManualTaskForm
            people={projectPeople}
            editingTask={editingTask}
            onAddTask={handleAddManualTask}
            onUpdateTask={handleUpdateTask}
            onCancelEdit={() => setEditingTask(null)}
            saving={saving}
          />
          <TaskList
            tasks={projectTasks}
            onDeleteTask={handleDeleteTask}
            onEditTask={setEditingTask}
          />
          <GanttPanel
            panelRef={ganttPanelRef}
            projectName={activeProject.name}
            projectGroupName={projectGroupName}
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
          groups={groups}
          newProjectGroupId={newProjectGroupId}
          onNewProjectGroupIdChange={setNewProjectGroupId}
        />
      )}
    </main>
  );
}
