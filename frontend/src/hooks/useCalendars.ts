import { useCallback, useEffect, useState } from "react";
import {
  addProject,
  addProjects,
  createCalendar as createCalendarInDb,
  deleteCalendar as deleteCalendarInDb,
  deleteProject as deleteProjectInDb,
  fetchCalendars,
  updateCalendarName as updateCalendarNameInDb,
  updateProject as updateProjectInDb,
  updateProjectDates as updateProjectDatesInDb,
  updateProjectDescription as updateProjectDescriptionInDb,
  saveProjectDetails as saveProjectDetailsInDb,
} from "../services/calendarService";
import type { Calendar, ProjectInput } from "../types/app";
import type { Project } from "../types/gantt";

export function useCalendars(enabled: boolean) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setCalendars([]);
      return;
    }

    setLoading(true);
    try {
      setError(null);
      setCalendars(await fetchCalendars());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de charger les calendriers.";
      setError(message);
      console.error("Erreur lors du chargement des calendriers :", err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createCalendar = useCallback(async (name: string, groupId: string | null): Promise<Calendar> => {
    setSaving(true);
    setError(null);
    try {
      const calendar = await createCalendarInDb(name, groupId);
      setCalendars((current) => [calendar, ...current]);
      return calendar;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de créer le calendrier.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const addProjectToCalendar = useCallback(
    async (calendarId: string, projectInput: ProjectInput): Promise<Project> => {
      setSaving(true);
      setError(null);
      try {
        const project = await addProject(
          calendarId,
          {
            name: projectInput.name,
            start: projectInput.start,
            end: projectInput.end,
            progress: projectInput.progress ?? 0,
          },
          projectInput.assigneeIds ?? [],
        );
        setCalendars((current) =>
          current.map((calendar) =>
            calendar.id === calendarId
              ? { ...calendar, projects: [...calendar.projects, project] }
              : calendar,
          ),
        );
        return project;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Impossible d'ajouter le projet.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const updateProjectInCalendar = useCallback(
    async (calendarId: string, projectId: string, projectInput: ProjectInput): Promise<Project> => {
      setSaving(true);
      setError(null);
      try {
        const project = await updateProjectInDb(
          projectId,
          {
            name: projectInput.name,
            start: projectInput.start,
            end: projectInput.end,
            progress: projectInput.progress ?? 0,
          },
          projectInput.assigneeIds ?? [],
        );
        setCalendars((current) =>
          current.map((calendar) =>
            calendar.id === calendarId
              ? {
                  ...calendar,
                  projects: calendar.projects.map((existing) =>
                    existing.id === projectId ? project : existing,
                  ),
                }
              : calendar,
          ),
        );
        return project;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Impossible de modifier le projet.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const appendProjectsToCalendar = useCallback(async (calendarId: string, projects: Project[]) => {
    if (projects.length === 0) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const insertedProjects = await addProjects(calendarId, projects);
      setCalendars((current) =>
        current.map((calendar) =>
          calendar.id === calendarId
            ? { ...calendar, projects: [...calendar.projects, ...insertedProjects] }
            : calendar,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'ajouter les projets.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const renameCalendar = useCallback(async (calendarId: string, name: string): Promise<Calendar> => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCalendarNameInDb(calendarId, name);
      let renamedCalendar: Calendar | null = null;
      setCalendars((current) =>
        current.map((calendar) => {
          if (calendar.id === calendarId) {
            renamedCalendar = { ...calendar, name: updated.name };
            return renamedCalendar;
          }
          return calendar;
        }),
      );
      if (!renamedCalendar) {
        throw new Error("Calendrier introuvable.");
      }
      return renamedCalendar;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de renommer le calendrier.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteCalendar = useCallback(async (calendarId: string): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await deleteCalendarInDb(calendarId);
      setCalendars((current) => current.filter((calendar) => calendar.id !== calendarId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer le calendrier.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateProjectDatesInCalendar = useCallback(
    async (calendarId: string, projectId: string, start: string, end: string): Promise<Project> => {
      setSaving(true);
      setError(null);
      try {
        const project = await updateProjectDatesInDb(projectId, start, end);
        setCalendars((current) =>
          current.map((calendar) =>
            calendar.id === calendarId
              ? {
                  ...calendar,
                  projects: calendar.projects.map((existing) =>
                    existing.id === projectId ? project : existing,
                  ),
                }
              : calendar,
          ),
        );
        return project;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Impossible de mettre à jour les dates du projet.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const updateProjectDescriptionInCalendar = useCallback(
    async (calendarId: string, projectId: string, description: string): Promise<Project> => {
      setSaving(true);
      setError(null);
      try {
        const project = await updateProjectDescriptionInDb(projectId, description);
        setCalendars((current) =>
          current.map((calendar) =>
            calendar.id === calendarId
              ? {
                  ...calendar,
                  projects: calendar.projects.map((existing) =>
                    existing.id === projectId ? project : existing,
                  ),
                }
              : calendar,
          ),
        );
        return project;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Impossible d'enregistrer la description.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const saveProjectDetailsInCalendar = useCallback(
    async (
      calendarId: string,
      projectId: string,
      details: { description: string; assigneeIds: string[] },
    ): Promise<Project> => {
      setSaving(true);
      setError(null);
      try {
        const project = await saveProjectDetailsInDb(projectId, details);
        setCalendars((current) =>
          current.map((calendar) =>
            calendar.id === calendarId
              ? {
                  ...calendar,
                  projects: calendar.projects.map((existing) =>
                    existing.id === projectId ? project : existing,
                  ),
                }
              : calendar,
          ),
        );
        return project;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Impossible d'enregistrer les détails du projet.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const deleteProjectFromCalendar = useCallback(
    async (calendarId: string, projectId: string): Promise<void> => {
      setSaving(true);
      setError(null);
      try {
        await deleteProjectInDb(projectId);
        setCalendars((current) =>
          current.map((calendar) =>
            calendar.id === calendarId
              ? {
                  ...calendar,
                  projects: calendar.projects.filter((project) => project.id !== projectId),
                }
              : calendar,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Impossible de supprimer le projet.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const getCalendarById = useCallback(
    (calendarId: string) => calendars.find((calendar) => calendar.id === calendarId),
    [calendars],
  );

  return {
    calendars,
    loading,
    saving,
    error,
    createCalendar,
    renameCalendar,
    deleteCalendar,
    addProjectToCalendar,
    updateProjectInCalendar,
    updateProjectDatesInCalendar,
    updateProjectDescriptionInCalendar,
    saveProjectDetailsInCalendar,
    appendProjectsToCalendar,
    deleteProjectFromCalendar,
    getCalendarById,
    reload,
  };
}
