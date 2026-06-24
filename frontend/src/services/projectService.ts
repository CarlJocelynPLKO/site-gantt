import { getSupabase } from "../supabaseClient";
import type { Project } from "../types/app";
import type { GanttTask } from "../types/gantt";
import type { PostgrestError } from "@supabase/supabase-js";

interface DbProject {
  id: string;
  name: string;
  group_id: string | null;
  created_at: string;
}

interface DbPersonRef {
  id: string;
  first_name: string;
  job_title: string;
}

interface DbAssignment {
  person_id: string;
  people: DbPersonRef | DbPersonRef[] | null;
}

interface DbTask {
  id: string;
  project_id: string;
  name: string;
  start_date: string;
  end_date: string;
  progress: number;
  task_assignments?: DbAssignment[];
}

function toServiceError(fallback: string, error: PostgrestError | null): Error {
  if (!error) {
    return new Error(fallback);
  }
  const details = [error.message, error.details, error.hint].filter(Boolean).join(" — ");
  return new Error(details || fallback);
}

function mapAssignees(assignments: DbAssignment[] | undefined): GanttTask["assignees"] {
  if (!assignments) {
    return [];
  }

  return assignments
    .map((assignment) => {
      const person = Array.isArray(assignment.people)
        ? assignment.people[0]
        : assignment.people;
      if (!person) {
        return null;
      }
      return {
        id: person.id,
        firstName: person.first_name,
        jobTitle: person.job_title,
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);
}

function mapTask(row: DbTask): GanttTask {
  return {
    id: row.id,
    name: row.name,
    start: row.start_date,
    end: row.end_date,
    progress: row.progress,
    assignees: mapAssignees(row.task_assignments),
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

async function replaceTaskAssignments(taskId: string, personIds: string[]): Promise<void> {
  const supabase = getSupabase();

  const { error: deleteError } = await supabase
    .from("task_assignments")
    .delete()
    .eq("task_id", taskId);

  if (deleteError) {
    throw toServiceError("Impossible de mettre à jour les affectations.", deleteError);
  }

  if (personIds.length === 0) {
    return;
  }

  const rows = personIds.map((personId) => ({ task_id: taskId, person_id: personId }));
  const { error: insertError } = await supabase.from("task_assignments").insert(rows);

  if (insertError) {
    throw toServiceError("Impossible d'enregistrer les affectations.", insertError);
  }
}

export async function fetchProjects(): Promise<Project[]> {
  const supabase = getSupabase();

  const { data: projectRows, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, group_id, created_at")
    .order("created_at", { ascending: false });

  if (projectsError) {
    throw toServiceError("Impossible de charger les projets.", projectsError);
  }

  const { data: taskRows, error: tasksError } = await supabase
    .from("tasks")
    .select(
      "id, project_id, name, start_date, end_date, progress, task_assignments(person_id, people(id, first_name, job_title))",
    );

  if (tasksError) {
    throw toServiceError("Impossible de charger les tâches.", tasksError);
  }

  const tasksByProject = groupTasksByProject((taskRows ?? []) as DbTask[]);

  return ((projectRows ?? []) as DbProject[]).map((project) => ({
    id: project.id,
    name: project.name,
    groupId: project.group_id,
    tasks: tasksByProject.get(project.id) ?? [],
  }));
}

export async function createProject(name: string, groupId: string | null): Promise<Project> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .insert({ name: name.trim(), group_id: groupId })
    .select("id, name, group_id")
    .single();

  if (error || !data) {
    throw toServiceError("Impossible de créer le projet.", error);
  }

  return {
    id: data.id,
    name: data.name,
    groupId: data.group_id,
    tasks: [],
  };
}

export async function updateProjectName(projectId: string, name: string): Promise<Project> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .update({ name: name.trim() })
    .eq("id", projectId)
    .select("id, name, group_id")
    .single();

  if (error || !data) {
    throw toServiceError("Impossible de renommer le projet.", error);
  }

  return {
    id: data.id,
    name: data.name,
    groupId: data.group_id,
    tasks: [],
  };
}

export async function addTask(
  projectId: string,
  task: Pick<GanttTask, "name" | "start" | "end" | "progress"> & { id?: string },
  assigneeIds: string[] = [],
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

  if (assigneeIds.length > 0) {
    await replaceTaskAssignments(data.id, assigneeIds);
  }

  const { data: fullTask, error: fetchError } = await supabase
    .from("tasks")
    .select(
      "id, project_id, name, start_date, end_date, progress, task_assignments(person_id, people(id, first_name, job_title))",
    )
    .eq("id", data.id)
    .single();

  if (fetchError || !fullTask) {
    return mapTask(data as DbTask);
  }

  return mapTask(fullTask as DbTask);
}

export async function updateTask(
  taskId: string,
  task: Pick<GanttTask, "name" | "start" | "end" | "progress">,
  assigneeIds: string[] = [],
): Promise<GanttTask> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      name: task.name,
      start_date: task.start,
      end_date: task.end,
      progress: task.progress,
    })
    .eq("id", taskId)
    .select("id, project_id, name, start_date, end_date, progress")
    .single();

  if (error || !data) {
    throw toServiceError("Impossible de modifier la tâche.", error);
  }

  await replaceTaskAssignments(taskId, assigneeIds);

  const { data: fullTask, error: fetchError } = await supabase
    .from("tasks")
    .select(
      "id, project_id, name, start_date, end_date, progress, task_assignments(person_id, people(id, first_name, job_title))",
    )
    .eq("id", taskId)
    .single();

  if (fetchError || !fullTask) {
    return mapTask(data as DbTask);
  }

  return mapTask(fullTask as DbTask);
}

export async function addTasks(
  projectId: string,
  tasks: GanttTask[],
  assigneeIdsByTask?: Record<string, string[]>,
): Promise<GanttTask[]> {
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

  const inserted = data as DbTask[];

  for (const task of inserted) {
    const assigneeIds = assigneeIdsByTask?.[task.id] ?? [];
    if (assigneeIds.length > 0) {
      await replaceTaskAssignments(task.id, assigneeIds);
    }
  }

  const ids = inserted.map((task) => task.id);
  const { data: fullTasks, error: fetchError } = await supabase
    .from("tasks")
    .select(
      "id, project_id, name, start_date, end_date, progress, task_assignments(person_id, people(id, first_name, job_title))",
    )
    .in("id", ids);

  if (fetchError || !fullTasks) {
    return inserted.map(mapTask);
  }

  return (fullTasks as DbTask[]).map(mapTask);
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) {
    throw toServiceError("Impossible de supprimer le projet.", error);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) {
    throw toServiceError("Impossible de supprimer la tâche.", error);
  }
}
