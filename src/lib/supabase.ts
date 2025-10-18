import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export type UserProfile = {
  id: string;
  email: string;
  bonk_points: number;
  total_corrections: number;
  languages_learned: string[];
  streak_days: number;
  level: number;
  daily_challenge: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ChatSession = {
  id: string;
  user_id: string;
  corrected_text: string;
  input_text: string;
  language: string;
  model: string;
  created_at?: string;
};

export type SavedLesson = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at?: string;
};
