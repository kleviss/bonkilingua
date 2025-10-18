"use client";

import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { useEffect, useState, createContext, useContext } from "react";

export type AuthUser = {
  id: string;
  email?: string;
};

export type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
};

// Create auth context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
        });
      }

      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (!error && data?.user) {
      // Create user profile in the profiles table
      await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        bonk_points: 0,
        total_corrections: 0,
        languages_learned: [],
        streak_days: 0,
        level: 1,
        daily_challenge: false,
      });
    }

    return { error, user: data?.user };
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
