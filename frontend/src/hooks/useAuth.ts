import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "../supabaseClient";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signUp({ email, password });
    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await getSupabase().auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }, []);

  return { session, user, loading, signIn, signUp, signOut, isAuthenticated: Boolean(user) };
}
