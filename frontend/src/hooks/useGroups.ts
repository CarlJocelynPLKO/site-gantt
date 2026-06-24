import { useCallback, useEffect, useState } from "react";
import {
  addPersonToGroup,
  createGroup,
  deleteGroup,
  deletePerson,
  fetchGroups,
} from "../services/groupService";
import type { Person, TeamGroup } from "../types/team";

export function useGroups(enabled: boolean) {
  const [groups, setGroups] = useState<TeamGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setGroups([]);
      return;
    }

    setLoading(true);
    try {
      setError(null);
      setGroups(await fetchGroups());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de charger les équipes.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createTeamGroup = useCallback(async (name: string) => {
    setSaving(true);
    setError(null);
    try {
      const group = await createGroup(name);
      setGroups((current) => [group, ...current]);
      return group;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de créer l'équipe.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeGroup = useCallback(async (groupId: string) => {
    setSaving(true);
    setError(null);
    try {
      await deleteGroup(groupId);
      setGroups((current) => current.filter((group) => group.id !== groupId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer l'équipe.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const addPerson = useCallback(async (groupId: string, firstName: string, jobTitle: string) => {
    setSaving(true);
    setError(null);
    try {
      const person = await addPersonToGroup(groupId, firstName, jobTitle);
      setGroups((current) =>
        current.map((group) =>
          group.id === groupId ? { ...group, people: [...group.people, person] } : group,
        ),
      );
      return person;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'ajouter la personne.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const removePerson = useCallback(async (groupId: string, personId: string) => {
    setSaving(true);
    setError(null);
    try {
      await deletePerson(personId);
      setGroups((current) =>
        current.map((group) =>
          group.id === groupId
            ? { ...group, people: group.people.filter((person) => person.id !== personId) }
            : group,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer la personne.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const getGroupById = useCallback(
    (groupId: string | null | undefined) =>
      groupId ? groups.find((group) => group.id === groupId) : undefined,
    [groups],
  );

  return {
    groups,
    loading,
    saving,
    error,
    reload,
    createTeamGroup,
    removeGroup,
    addPerson,
    removePerson,
    getGroupById,
  };
}

export type { Person, TeamGroup };
