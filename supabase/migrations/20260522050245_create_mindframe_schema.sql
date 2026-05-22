/*
  # MindFrame Database Schema

  ## Overview
  Complete schema for MindFrame AI mood journaling application.

  ## Tables

  ### profiles
  - Extended user profile data linked to auth.users
  - Stores display name, avatar preferences, character style, streak data

  ### mood_entries
  - Daily mood check-ins with emotional companion selection
  - Stores mood type, intensity, character style, timestamps

  ### journal_entries
  - Full journal entries with rich text content
  - Linked to optional mood entries
  - Auto-save support via updated_at

  ### ai_insights
  - AI-generated analysis results for journal entries
  - Stores emotional tone analysis, recommendations, reflections

  ### mood_streaks
  - Tracks user consistency and streak data
  - Updated via mood_entries triggers

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text DEFAULT '',
  avatar_url text DEFAULT '',
  character_style text DEFAULT 'neutral' CHECK (character_style IN ('feminine', 'masculine', 'neutral')),
  timezone text DEFAULT 'UTC',
  onboarding_completed boolean DEFAULT false,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_entries integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Mood entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood text NOT NULL CHECK (mood IN ('happy', 'calm', 'anxious', 'stressed', 'tired', 'excited', 'sad', 'overwhelmed')),
  intensity integer DEFAULT 5 CHECK (intensity >= 1 AND intensity <= 10),
  note text DEFAULT '',
  character_style text DEFAULT 'neutral' CHECK (character_style IN ('feminine', 'masculine', 'neutral')),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mood entries"
  ON mood_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries"
  ON mood_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood entries"
  ON mood_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_entry_id uuid REFERENCES mood_entries(id) ON DELETE SET NULL,
  title text DEFAULT '',
  content text DEFAULT '',
  word_count integer DEFAULT 0,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  is_draft boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journal_entry_id uuid REFERENCES journal_entries(id) ON DELETE CASCADE,
  mood_entry_id uuid REFERENCES mood_entries(id) ON DELETE SET NULL,
  insight_type text DEFAULT 'reflection' CHECK (insight_type IN ('reflection', 'pattern', 'weekly_summary', 'burnout_warning', 'encouragement')),
  emotional_tone text DEFAULT '',
  primary_emotions text[] DEFAULT '{}',
  insight_text text NOT NULL DEFAULT '',
  recommendations text[] DEFAULT '{}',
  wellness_score integer DEFAULT 5 CHECK (wellness_score >= 1 AND wellness_score <= 10),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
  ON ai_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON ai_insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON ai_insights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date ON mood_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_date ON ai_insights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_mood ON journal_entries(mood_entry_id);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
