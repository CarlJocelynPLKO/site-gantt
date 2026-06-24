import { getSupabase } from "../supabaseClient";
import type { Person, TeamGroup } from "../types/team";
import type { PostgrestError } from "@supabase/supabase-js";

interface DbGroup {
  id: string;
  name: string;
}

interface DbPerson {
  id: string;
  group_id: string;
  first_name: string;
  job_title: string;
}

function toServiceError(fallback: string, error: PostgrestError | null): Error {
  if (!error) {
    return new Error(fallback);
  }
  const details = [error.message, error.details, error.hint].filter(Boolean).join(" — ");
  return new Error(details || fallback);
}

function mapPerson(row: DbPerson): Person {
  return {
    id: row.id,
    groupId: row.group_id,
    firstName: row.first_name,
    jobTitle: row.job_title,
  };
}

export async function fetchGroups(): Promise<TeamGroup[]> {
  const supabase = getSupabase();

  const { data: groupRows, error: groupsError } = await supabase
    .from("groups")
    .select("id, name")
    .order("created_at", { ascending: false });

  if (groupsError) {
    throw toServiceError("Impossible de charger les équipes.", groupsError);
  }

  const { data: peopleRows, error: peopleError } = await supabase
    .from("people")
    .select("id, group_id, first_name, job_title");

  if (peopleError) {
    throw toServiceError("Impossible de charger les membres.", peopleError);
  }

  const peopleByGroup = new Map<string, Person[]>();
  for (const row of (peopleRows ?? []) as DbPerson[]) {
    const list = peopleByGroup.get(row.group_id) ?? [];
    list.push(mapPerson(row));
    peopleByGroup.set(row.group_id, list);
  }

  return ((groupRows ?? []) as DbGroup[]).map((group) => ({
    id: group.id,
    name: group.name,
    people: peopleByGroup.get(group.id) ?? [],
  }));
}

export async function createGroup(name: string): Promise<TeamGroup> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("groups")
    .insert({ name: name.trim() })
    .select("id, name")
    .single();

  if (error || !data) {
    throw toServiceError("Impossible de créer l'équipe.", error);
  }

  return { id: data.id, name: data.name, people: [] };
}

export async function deleteGroup(groupId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) {
    throw toServiceError("Impossible de supprimer l'équipe.", error);
  }
}

export async function addPersonToGroup(
  groupId: string,
  firstName: string,
  jobTitle: string,
): Promise<Person> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("people")
    .insert({
      group_id: groupId,
      first_name: firstName.trim(),
      job_title: jobTitle.trim(),
    })
    .select("id, group_id, first_name, job_title")
    .single();

  if (error || !data) {
    throw toServiceError("Impossible d'ajouter la personne.", error);
  }

  return mapPerson(data as DbPerson);
}

export async function deletePerson(personId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("people").delete().eq("id", personId);
  if (error) {
    throw toServiceError("Impossible de supprimer la personne.", error);
  }
}
