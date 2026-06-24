import { getSupabase } from "../supabaseClient";
import type { Calendar } from "../types/app";
import type { Project } from "../types/gantt";
import type { PostgrestError } from "@supabase/supabase-js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

interface DbCalendarRow {
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

interface DbProjectRow {
  id: string;
  project_id: string;
  name: string;
  start_date: string;
  end_date: string;
  progress: number;
  description?: string | null;
  task_assignments?: DbAssignment[];
}

function toServiceError(fallback: string, error: PostgrestError | null): Error {
  if (!error) {
    return new Error(fallback);
  }
  const details = [error.message, error.details, error.hint].filter(Boolean).join(" — ");
  return new Error(details || fallback);
}

function mapAssignees(assignments: DbAssignment[] | undefined): Project["assignees"] {
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

function mapProject(row: DbProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    start: row.start_date,
    end: row.end_date,
    progress: row.progress,
    description: row.description ?? null,
    assignees: mapAssignees(row.task_assignments),
  };
}

function groupProjectsByCalendar(rows: DbProjectRow[]): Map<string, Project[]> {
  const projectsByCalendar = new Map<string, Project[]>();

  for (const row of rows) {
    const calendarProjects = projectsByCalendar.get(row.project_id) ?? [];
    calendarProjects.push(mapProject(row));
    projectsByCalendar.set(row.project_id, calendarProjects);
  }

  return projectsByCalendar;
}

async function replaceProjectAssignments(projectId: string, personIds: string[]): Promise<void> {
  const supabase = getSupabase();

  const { error: deleteError } = await supabase
    .from("task_assignments")
    .delete()
    .eq("task_id", projectId);

  if (deleteError) {
    throw toServiceError("Impossible de mettre à jour les affectations.", deleteError);
  }

  if (personIds.length === 0) {
    return;
  }

  const rows = personIds.map((personId) => ({ task_id: projectId, person_id: personId }));
  const { error: insertError } = await supabase.from("task_assignments").insert(rows);

  if (insertError) {
    throw toServiceError("Impossible d'enregistrer les affectations.", insertError);
  }
}

export async function fetchCalendars(): Promise<Calendar[]> {
  const supabase = getSupabase();

  const { data: calendarRows, error: calendarsError } = await supabase
    .from("projects")
    .select("id, name, group_id, created_at")
    .order("created_at", { ascending: false });

  if (calendarsError) {
    throw toServiceError("Impossible de charger les calendriers.", calendarsError);
  }

  const { data: projectRows, error: projectsError } = await supabase
    .from("tasks")
    .select(
      "id, project_id, name, start_date, end_date, progress, description, task_assignments(person_id, people(id, first_name, job_title))",
    );

  if (projectsError) {
    throw toServiceError("Impossible de charger les projets.", projectsError);
  }

  const projectsByCalendar = groupProjectsByCalendar((projectRows ?? []) as DbProjectRow[]);

  return ((calendarRows ?? []) as DbCalendarRow[]).map((calendar) => ({
    id: calendar.id,
    name: calendar.name,
    groupId: calendar.group_id,
    projects: projectsByCalendar.get(calendar.id) ?? [],
  }));
}

export async function createCalendar(name: string, groupId: string | null): Promise<Calendar> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .insert({ name: name.trim(), group_id: groupId })
    .select("id, name, group_id")
    .single();

  if (error || !data) {
    throw toServiceError("Impossible de créer le calendrier.", error);
  }

  return {
    id: data.id,
    name: data.name,
    groupId: data.group_id,
    projects: [],
  };
}

export async function updateCalendarName(calendarId: string, name: string): Promise<Calendar> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .update({ name: name.trim() })
    .eq("id", calendarId)
    .select("id, name, group_id")
    .single();

  if (error || !data) {
    throw toServiceError("Impossible de renommer le calendrier.", error);
  }

  return {
    id: data.id,
    name: data.name,
    groupId: data.group_id,
    projects: [],
  };
}

export async function addProject(
  calendarId: string,
  project: Pick<Project, "name" | "start" | "end" | "progress"> & { id?: string },
  assigneeIds: string[] = [],
): Promise<Project> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...(project.id && isValidUuid(project.id) ? { id: project.id } : {}),
      project_id: calendarId,
      name: project.name,
      start_date: project.start,
      end_date: project.end,
      progress: project.progress,
    })
    .select("id, project_id, name, start_date, end_date, progress, description")
    .single();

  if (error || !data) {
    throw toServiceError("Impossible d'ajouter le projet.", error);
  }

  if (assigneeIds.length > 0) {
    await replaceProjectAssignments(data.id, assigneeIds);
  }

  const { data: fullProject, error: fetchError } = await supabase
    .from("tasks")
    .select(
      "id, project_id, name, start_date, end_date, progress, description, task_assignments(person_id, people(id, first_name, job_title))",
    )
    .eq("id", data.id)
    .single();

  if (fetchError || !fullProject) {
    return mapProject(data as DbProjectRow);
  }

  return mapProject(fullProject as DbProjectRow);
}

export async function updateProject(
  projectId: string,
  project: Pick<Project, "name" | "start" | "end" | "progress">,
  assigneeIds: string[] = [],
): Promise<Project> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      name: project.name,
      start_date: project.start,
      end_date: project.end,
      progress: project.progress,
    })
    .eq("id", projectId)
    .select("id, project_id, name, start_date, end_date, progress, description")
    .single();

  if (error || !data) {
    throw toServiceError("Impossible de modifier le projet.", error);
  }

  await replaceProjectAssignments(projectId, assigneeIds);

  const { data: fullProject, error: fetchError } = await supabase
    .from("tasks")
    .select(
      "id, project_id, name, start_date, end_date, progress, description, task_assignments(person_id, people(id, first_name, job_title))",
    )
    .eq("id", projectId)
    .single();

  if (fetchError || !fullProject) {
    return mapProject(data as DbProjectRow);
  }

  return mapProject(fullProject as DbProjectRow);
}

export async function addProjects(
  calendarId: string,
  projects: Project[],
  assigneeIdsByProject?: Record<string, string[]>,
): Promise<Project[]> {
  if (projects.length === 0) {
    return [];
  }

  const rows = projects.map((project) => {
    const row: {
      id?: string;
      project_id: string;
      name: string;
      start_date: string;
      end_date: string;
      progress: number;
    } = {
      project_id: calendarId,
      name: project.name,
      start_date: project.start,
      end_date: project.end,
      progress: project.progress,
    };

    if (project.id && isValidUuid(project.id)) {
      row.id = project.id;
    }

    return row;
  });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .insert(rows)
    .select("id, project_id, name, start_date, end_date, progress, description");

  if (error || !data) {
    throw toServiceError("Impossible d'ajouter les projets.", error);
  }

  const inserted = data as DbProjectRow[];

  for (const project of inserted) {
    const assigneeIds = assigneeIdsByProject?.[project.id] ?? [];
    if (assigneeIds.length > 0) {
      await replaceProjectAssignments(project.id, assigneeIds);
    }
  }

  const ids = inserted.map((project) => project.id);
  const { data: fullProjects, error: fetchError } = await supabase
    .from("tasks")
    .select(
      "id, project_id, name, start_date, end_date, progress, description, task_assignments(person_id, people(id, first_name, job_title))",
    )
    .in("id", ids);

  if (fetchError || !fullProjects) {
    return inserted.map(mapProject);
  }

  return (fullProjects as DbProjectRow[]).map(mapProject);
}

export async function updateProjectDates(
  projectId: string,
  start: string,
  end: string,
): Promise<Project> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("tasks")
    .update({ start_date: start, end_date: end })
    .eq("id", projectId)
    .select("id, project_id, name, start_date, end_date, progress, description")
    .single();

  if (error || !data) {
    throw toServiceError("Impossible de mettre à jour les dates du projet.", error);
  }

  const { data: fullProject, error: fetchError } = await supabase
    .from("tasks")
    .select(
      "id, project_id, name, start_date, end_date, progress, description, task_assignments(person_id, people(id, first_name, job_title))",
    )
    .eq("id", projectId)
    .single();

  if (fetchError || !fullProject) {
    return mapProject(data as DbProjectRow);
  }

  return mapProject(fullProject as DbProjectRow);
}

export async function updateProjectDescription(
  projectId: string,
  description: string,
): Promise<Project> {
  const supabase = getSupabase();
  const normalized = description.trim();

  const { data, error } = await supabase
    .from("tasks")
    .update({ description: normalized || null })
    .eq("id", projectId)
    .select("id, project_id, name, start_date, end_date, progress, description")
    .single();

  if (error || !data) {
    throw toServiceError("Impossible d'enregistrer la description.", error);
  }

  const { data: fullProject, error: fetchError } = await supabase
    .from("tasks")
    .select(
      "id, project_id, name, start_date, end_date, progress, description, task_assignments(person_id, people(id, first_name, job_title))",
    )
    .eq("id", projectId)
    .single();

  if (fetchError || !fullProject) {
    return mapProject(data as DbProjectRow);
  }

  return mapProject(fullProject as DbProjectRow);
}

export async function saveProjectDetails(
  projectId: string,
  details: { description: string; assigneeIds: string[] },
): Promise<Project> {
  const supabase = getSupabase();
  const normalized = details.description.trim();

  const { error } = await supabase
    .from("tasks")
    .update({ description: normalized || null })
    .eq("id", projectId);

  if (error) {
    throw toServiceError("Impossible d'enregistrer les détails du projet.", error);
  }

  await replaceProjectAssignments(projectId, details.assigneeIds);

  const { data: fullProject, error: fetchError } = await supabase
    .from("tasks")
    .select(
      "id, project_id, name, start_date, end_date, progress, description, task_assignments(person_id, people(id, first_name, job_title))",
    )
    .eq("id", projectId)
    .single();

  if (fetchError || !fullProject) {
    throw toServiceError("Impossible de charger le projet mis à jour.", fetchError);
  }

  return mapProject(fullProject as DbProjectRow);
}

export async function deleteCalendar(calendarId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("projects").delete().eq("id", calendarId);
  if (error) {
    throw toServiceError("Impossible de supprimer le calendrier.", error);
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("tasks").delete().eq("id", projectId);
  if (error) {
    throw toServiceError("Impossible de supprimer le projet.", error);
  }
}
