"use client";

import { useEffect, useState, useMemo } from "react";
import { createSupabaseClient } from "@/services/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { UserRow } from "@/types/database";

interface AuthState {
  user: User | null;
  profile: UserRow | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  });

  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setState({
          user: session.user,
          profile: profile as UserRow | null,
          session,
          loading: false,
        });
      } else {
        setState({ user: null, profile: null, session: null, loading: false });
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setState({
          user: session.user,
          profile: profile as UserRow | null,
          session,
          loading: false,
        });
      } else {
        setState({ user: null, profile: null, session: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
  };
}
