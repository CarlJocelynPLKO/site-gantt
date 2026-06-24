import { useCallback, useEffect, useState } from "react";
import {
  addTask,
  addTasks,
  createProject as createProjectInDb,
  deleteProject as deleteProjectInDb,
  deleteTask as deleteTaskInDb,
  fetchProjects,
  updateProjectName as updateProjectNameInDb,
} from "../services/projectService";
import type { GanttTask } from "../types/gantt";
import type { Project } from "../types/app";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setProjects(await fetchProjects());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de charger les projets.";
      setError(message);
      console.error("Erreur lors du chargement des projets :", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const createProject = useCallback(async (name: string): Promise<Project> => {
    setSaving(true);
    setError(null);

    try {
      const project = await createProjectInDb(name);
      setProjects((current) => [project, ...current]);
      return project;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de créer le projet.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const addTaskToProject = useCallback(
    async (
      projectId: string,
      taskInput: Pick<GanttTask, "name" | "start" | "end" | "progress"> & { id?: string },
    ): Promise<GanttTask> => {
      setSaving(true);
      setError(null);

      try {
        const task = await addTask(projectId, taskInput);
        setProjects((current) =>
          current.map((project) =>
            project.id === projectId ? { ...project, tasks: [...project.tasks, task] } : project,
          ),
        );
        return task;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Impossible d'ajouter la tâche.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const appendTasksToProject = useCallback(async (projectId: string, tasks: GanttTask[]) => {
    if (tasks.length === 0) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const insertedTasks = await addTasks(projectId, tasks);
      setProjects((current) =>
        current.map((project) =>
          project.id === projectId
            ? { ...project, tasks: [...project.tasks, ...insertedTasks] }
            : project,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'ajouter les tâches.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const renameProject = useCallback(async (projectId: string, name: string): Promise<Project> => {
    setSaving(true);
    setError(null);

    try {
      const updated = await updateProjectNameInDb(projectId, name);
      let renamedProject: Project | null = null;

      setProjects((current) =>
        current.map((project) => {
          if (project.id === projectId) {
            renamedProject = { ...project, name: updated.name };
            return renamedProject;
          }
          return project;
        }),
      );

      if (!renamedProject) {
        throw new Error("Projet introuvable.");
      }

      return renamedProject;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de renommer le projet.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    setSaving(true);
    setError(null);

    try {
      await deleteProjectInDb(projectId);
      setProjects((current) => current.filter((project) => project.id !== projectId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer le projet.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteTaskFromProject = useCallback(
    async (projectId: string, taskId: string): Promise<void> => {
      setSaving(true);
      setError(null);

      try {
        await deleteTaskInDb(taskId);
        setProjects((current) =>
          current.map((project) =>
            project.id === projectId
              ? { ...project, tasks: project.tasks.filter((task) => task.id !== taskId) }
              : project,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Impossible de supprimer la tâche.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const getProjectById = useCallback(
    (projectId: string) => projects.find((project) => project.id === projectId),
    [projects],
  );

  return {
    projects,
    loading,
    saving,
    error,
    createProject,
    renameProject,
    deleteProject,
    addTaskToProject,
    appendTasksToProject,
    deleteTaskFromProject,
    getProjectById,
    reload,
  };
}
