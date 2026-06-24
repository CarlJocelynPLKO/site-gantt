import { useState } from "react";
import type { ViewMode } from "frappe-gantt";
import { AppHeader } from "./components/AppHeader";
import { AuthPanel } from "./components/AuthPanel";
import { ColumnMappingPanel } from "./components/ColumnMappingPanel";
import { Dashboard } from "./components/Dashboard";
import { FileUpload } from "./components/FileUpload";
import { GanttPanel } from "./components/GanttPanel";
import { GroupsManager } from "./components/GroupsManager";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { ManualProjectForm } from "./components/ManualProjectForm";
import { ProjectDetailsModal } from "./components/ProjectDetailsModal";
import { ProjectList } from "./components/ProjectList";
import { useAuth } from "./hooks/useAuth";
import { analyzeFile, generateGantt } from "./hooks/useGanttApi";
import { useCalendars } from "./hooks/useCalendars";
import { useGroups } from "./hooks/useGroups";
import type { AppStep } from "./types/app";
import type { AnalyzeResponse, ColumnSelection } from "./types/gantt";
import { fileNameToCalendarName } from "./utils/fileNameToCalendarName";

export function AppWithCalendars() {
  const { user, loading: authLoading, signIn, signUp, signOut, isAuthenticated } = useAuth();

  const {
    calendars,
    loading: calendarsLoading,
    saving,
    error: calendarsError,
    createCalendar,
    renameCalendar,
    deleteCalendar,
    addProjectToCalendar,
    saveProjectDetailsInCalendar,
    updateProjectDatesInCalendar,
    appendProjectsToCalendar,
    deleteProjectFromCalendar,
    getCalendarById,
  } = useCalendars(isAuthenticated);

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
  const [activeCalendarId, setActiveCalendarId] = useState<string | null>(null);
  const [detailsProjectId, setDetailsProjectId] = useState<string | null>(null);
  const [importTargetCalendarId, setImportTargetCalendarId] = useState<string | null>(null);
  const [importAsNewCalendar, setImportAsNewCalendar] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [newCalendarGroupId, setNewCalendarGroupId] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("Week");

  const activeCalendar = activeCalendarId ? getCalendarById(activeCalendarId) : undefined;
  const calendarProjects = activeCalendar?.projects ?? [];
  const detailsProject = detailsProjectId
    ? (calendarProjects.find((project) => project.id === detailsProjectId) ?? null)
    : null;
  const calendarPeople = activeCalendar?.groupId
    ? (getGroupById(activeCalendar.groupId)?.people ?? [])
    : [];
  const calendarGroupName = activeCalendar?.groupId
    ? getGroupById(activeCalendar.groupId)?.name
    : undefined;

  const displayError = error ?? calendarsError ?? groupsError;

  const resetImportState = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setImportTargetCalendarId(null);
    setImportAsNewCalendar(false);
    setNewCalendarName("");
    setNewCalendarGroupId("");
  };

  const goToDashboard = () => {
    setStep("dashboard");
    setActiveCalendarId(null);
    setDetailsProjectId(null);
    resetImportState();
    setError(null);
  };

  const handleCreateCalendar = async (name: string, groupId: string | null) => {
    try {
      const calendar = await createCalendar(name, groupId);
      setActiveCalendarId(calendar.id);
      setStep("calendar");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le calendrier.");
    }
  };

  const handleOpenCalendar = (calendarId: string) => {
    setActiveCalendarId(calendarId);
    setDetailsProjectId(null);
    setStep("calendar");
    setError(null);
    resetImportState();
  };

  const handleDeleteCalendar = async (calendarId: string) => {
    try {
      await deleteCalendar(calendarId);
      if (activeCalendarId === calendarId) {
        goToDashboard();
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer le calendrier.");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!activeCalendarId) {
      return;
    }
    try {
      await deleteProjectFromCalendar(activeCalendarId, projectId);
      if (detailsProjectId === projectId) {
        setDetailsProjectId(null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer le projet.");
    }
  };

  const handleAddManualProject = async (projectInput: {
    name: string;
    start: string;
    end: string;
    assigneeIds: string[];
  }) => {
    if (!activeCalendarId) {
      return;
    }
    try {
      await addProjectToCalendar(activeCalendarId, {
        name: projectInput.name,
        start: projectInput.start,
        end: projectInput.end,
        progress: 0,
        assigneeIds: projectInput.assigneeIds,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'ajouter le projet.");
    }
  };

  const handleSaveProjectDetails = async (
    projectId: string,
    details: { description: string; assigneeIds: string[] },
  ) => {
    if (!activeCalendarId) {
      return;
    }
    try {
      await saveProjectDetailsInCalendar(activeCalendarId, projectId, details);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'enregistrer les détails du projet.",
      );
      throw err;
    }
  };

  const handleProjectDatesChange = async (projectId: string, start: string, end: string) => {
    if (!activeCalendarId) {
      return;
    }
    try {
      await updateProjectDatesInCalendar(activeCalendarId, projectId, start, end);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de mettre à jour les dates du projet.",
      );
    }
  };

  const handleRenameCalendar = async (name: string) => {
    if (!activeCalendarId) {
      return;
    }
    try {
      await renameCalendar(activeCalendarId, name);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de renommer le calendrier.");
    }
  };

  const startImport = (targetCalendarId: string | null) => {
    setImportTargetCalendarId(targetCalendarId);
    setImportAsNewCalendar(targetCalendarId === null);
    setNewCalendarName("");
    setNewCalendarGroupId("");
    setStep("upload");
    setError(null);
  };

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setError(null);

    if (importAsNewCalendar) {
      setNewCalendarName(fileNameToCalendarName(file.name));
    }

    setStep("analyzing");

    try {
      const result = await analyzeFile(file);
      setAnalysis(result);
      setStep("mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'analyser le fichier.");
      setStep(importTargetCalendarId ? "calendar" : "upload");
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

      if (importTargetCalendarId) {
        await appendProjectsToCalendar(importTargetCalendarId, result.projects);
        setActiveCalendarId(importTargetCalendarId);
        setStep("calendar");
        resetImportState();
      } else if (importAsNewCalendar) {
        const calendarName =
          newCalendarName.trim() || fileNameToCalendarName(selectedFile.name);
        const calendar = await createCalendar(calendarName, newCalendarGroupId || null);
        await appendProjectsToCalendar(calendar.id, result.projects);
        setActiveCalendarId(calendar.id);
        setStep("calendar");
        resetImportState();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de générer le diagramme.");
    } finally {
      setGenerating(false);
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

      {step === "dashboard" && (calendarsLoading || groupsLoading) && <LoadingSkeleton />}

      {step === "dashboard" && !calendarsLoading && !groupsLoading && (
        <Dashboard
          calendars={calendars}
          groups={groups}
          saving={saving}
          onCreateCalendar={handleCreateCalendar}
          onOpenCalendar={handleOpenCalendar}
          onDeleteCalendar={handleDeleteCalendar}
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

      {step === "calendar" && activeCalendarId && !activeCalendar && <LoadingSkeleton />}

      {step === "calendar" && activeCalendar && (
        <>
          <ManualProjectForm
            people={calendarPeople}
            onAddProject={handleAddManualProject}
            saving={saving}
          />
          <ProjectList
            projects={calendarProjects}
            onDeleteProject={handleDeleteProject}
            onShowProjectDetails={(project) => setDetailsProjectId(project.id)}
          />
          <GanttPanel
            calendarName={activeCalendar.name}
            calendarGroupName={calendarGroupName}
            onRenameCalendar={handleRenameCalendar}
            saving={saving}
            projects={calendarProjects}
            calendarPeople={calendarPeople}
            warnings={[]}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onExportError={setError}
            showManualEntry={false}
            onImport={() => startImport(activeCalendar.id)}
            onDeleteProject={handleDeleteProject}
            onShowProjectDetails={(project) => setDetailsProjectId(project.id)}
            onProjectDatesChange={handleProjectDatesChange}
          />
          <ProjectDetailsModal
            project={detailsProject}
            people={calendarPeople}
            saving={saving}
            onClose={() => setDetailsProjectId(null)}
            onSave={handleSaveProjectDetails}
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
          showNewCalendarName={importAsNewCalendar}
          newCalendarName={newCalendarName}
          onNewCalendarNameChange={setNewCalendarName}
          groups={groups}
          newCalendarGroupId={newCalendarGroupId}
          onNewCalendarGroupIdChange={setNewCalendarGroupId}
        />
      )}
    </main>
  );
}
