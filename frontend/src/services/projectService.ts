import { getSupabase } from "../supabaseClient";
import type { Project } from "../types/app";
import type { GanttTask } from "../types/gantt";
import type { PostgrestError } from "@supabase/supabase-js";

interface DbProject {  id: string;
  name: string;
  created_at: string;
}

interface DbTask {
  id: string;
  project_id: string;
  name: string;
  start_date: string;
  end_date: string;
  progress: number;
}

function mapTask(row: DbTask): GanttTask {
  return {
    id: row.id,
    name: row.name,
    start: row.start_date,
    end: row.end_date,
    progress: row.progress,
  };
}

function groupTasksByProject(tasks: DbTask[]): Map<string, GanttTask[]> {
  const tasksByProject = new Map<string, GanttTask[]>();

  for (const row of tasks) {
    const projectTasks = tasksByProject.get(row.project_id) ?? [];
    projectTasks.push(mapTask(row));
    tasksByProject.set(row.project_id, projectTasks);
  }

  return tasksByProject;
}

function toServiceError(fallback: string, error: PostgrestError | null): Error {
  if (!error) {
    return new Error(fallback);
  }

  const details = [error.message, error.details, error.hint].filter(Boolean).join(" — ");
  return new Error(details || fallback);
}

export async function fetchProjects(): Promise<Project[]> {  const supabase = getSupabase();
  const { data: projectRows, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (projectsError) {
    throw toServiceError("Impossible de charger les projets.", projectsError);
  }
  const { data: taskRows, error: tasksError } = await supabase
    .from("tasks")
    .select("id, project_id, name, start_date, end_date, progress");

  if (tasksError) {
    throw toServiceError("Impossible de charger les tâches.", tasksError);
  }
  const tasksByProject = groupTasksByProject((taskRows ?? []) as DbTask[]);

  return ((projectRows ?? []) as DbProject[]).map((project) => ({
    id: project.id,
    name: project.name,
    tasks: tasksByProject.get(project.id) ?? [],
  }));
}

export async function createProject(name: string): Promise<Project> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .insert({ name: name.trim() })
    .select("id, name")
    .single();

  if (error || !data) {
    throw toServiceError("Impossible de créer le projet.", error);
  }

  return {
    id: data.id,
    name: data.name,
    tasks: [],
  };
}

export async function updateProjectName(projectId: string, name: string): Promise<Project> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .update({ name: name.trim() })
    .eq("id", projectId)
    .select("id, name")
    .single();

  if (error || !data) {
    throw toServiceError("Impossible de renommer le projet.", error);
  }

  return {
    id: data.id,
    name: data.name,
    tasks: [],
  };
}

export async function addTask(
  projectId: string,
  task: Pick<GanttTask, "name" | "start" | "end" | "progress"> & { id?: string },
): Promise<GanttTask> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...(task.id ? { id: task.id } : {}),
      project_id: projectId,
      name: task.name,
      start_date: task.start,
      end_date: task.end,
      progress: task.progress,
    })
    .select("id, project_id, name, start_date, end_date, progress")
    .single();

  if (error || !data) {
    throw toServiceError("Impossible d'ajouter la tâche.", error);
  }
  return mapTask(data as DbTask);
}

export async function addTasks(projectId: string, tasks: GanttTask[]): Promise<GanttTask[]> {
  if (tasks.length === 0) {
    return [];
  }

  const rows = tasks.map((task) => ({
    id: task.id,
    project_id: projectId,
    name: task.name,
    start_date: task.start,
    end_date: task.end,
    progress: task.progress,
  }));

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .insert(rows)
    .select("id, project_id, name, start_date, end_date, progress");

  if (error || !data) {
    throw toServiceError("Impossible d'ajouter les tâches.", error);
  }
  return (data as DbTask[]).map(mapTask);
}
