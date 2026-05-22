import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type MoodType = 'happy' | 'calm' | 'anxious' | 'stressed' | 'tired' | 'excited' | 'sad' | 'overwhelmed';
export type CharacterStyle = 'feminine' | 'masculine' | 'neutral';
export type InsightType = 'reflection' | 'pattern' | 'weekly_summary' | 'burnout_warning' | 'encouragement';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string;
  character_style: CharacterStyle;
  timezone: string;
  onboarding_completed: boolean;
  current_streak: number;
  longest_streak: number;
  total_entries: number;
  created_at: string;
  updated_at: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood: MoodType;
  intensity: number;
  note: string;
  character_style: CharacterStyle;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  mood_entry_id: string | null;
  title: string;
  content: string;
  word_count: number;
  entry_date: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiInsight {
  id: string;
  user_id: string;
  journal_entry_id: string | null;
  mood_entry_id: string | null;
  insight_type: InsightType;
  emotional_tone: string;
  primary_emotions: string[];
  insight_text: string;
  recommendations: string[];
  wellness_score: number;
  created_at: string;
}
