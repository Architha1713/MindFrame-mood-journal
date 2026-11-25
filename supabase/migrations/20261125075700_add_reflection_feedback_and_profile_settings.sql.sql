/*
# Add reflection feedback table and profile settings

## Overview
Adds user preferences for companion appearance and reflection tone, and a new
table for optional feedback on generated reflections. Also fixes the
ai_insights.insight_type CHECK constraint so it includes the `daily_summary`
type that the application already uses.

## 1. profiles — new columns
- `avatar_enabled` (boolean, default true): when false, the UI shows
  icon-only mood chips instead of the full companion avatar. Default keeps
  the existing behavior (avatars on).
- `reflection_tone` (text, default 'warm', CHECK in ('neutral','warm')):
  selects between a neutral/analytical and warm/supportive variant of each
  reflection template. Default stays warm to match the existing voice.

## 2. reflection_feedback — new table
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid(), references auth.users
  with ON DELETE CASCADE)
- `insight_id` (uuid, references ai_insights with ON DELETE CASCADE)
- `naturalness` (smallint, 1-5): user rating of how natural vs too
  human-like the reflection felt
- `trust` (smallint, 1-5): user rating of how much they trust the reflection
- `created_at` (timestamptz, default now())

## 3. ai_insights — fix insight_type constraint
The existing CHECK only allows reflection/pattern/weekly_summary/
burnout_warning/encouragement. The edge function already writes
`daily_summary`, which currently violates the constraint on new databases.
This migration drops and recreates the constraint to add `daily_summary`.

## Security
- RLS enabled on reflection_feedback; owner-scoped CRUD to authenticated.
- Grants: authenticated get SELECT/INSERT/UPDATE/DELETE on their own rows.
- service_role gets CRUD (used by the edge function to read feedback).
- Existing profiles policies unchanged; the new columns are user-editable
  through the existing UPDATE policy (they are user preferences, not
  privileged fields).
- reflection_feedback gets an index on user_id for quick per-user lookups
  and a unique constraint so a user can leave at most one feedback row per
  insight.

## Notes
- All statements are idempotent (IF NOT EXISTS / DROP IF EXISTS).
- No data is deleted or transformed; existing profile rows pick up the new
  column defaults automatically.
*/

-- 1. profiles columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_enabled boolean DEFAULT true;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reflection_tone text DEFAULT 'warm'
    CHECK (reflection_tone IS NULL OR reflection_tone IN ('neutral', 'warm'));

-- 2. reflection_feedback table
CREATE TABLE IF NOT EXISTS reflection_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_id uuid REFERENCES ai_insights(id) ON DELETE CASCADE,
  naturalness smallint CHECK (naturalness >= 1 AND naturalness <= 5),
  trust smallint CHECK (trust >= 1 AND trust <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, insight_id)
);

ALTER TABLE reflection_feedback ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON reflection_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON reflection_feedback TO service_role;

DROP POLICY IF EXISTS "select_own_feedback" ON reflection_feedback;
CREATE POLICY "select_own_feedback"
  ON reflection_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_feedback" ON reflection_feedback;
CREATE POLICY "insert_own_feedback"
  ON reflection_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_feedback" ON reflection_feedback;
CREATE POLICY "update_own_feedback"
  ON reflection_feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_feedback" ON reflection_feedback;
CREATE POLICY "delete_own_feedback"
  ON reflection_feedback FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reflection_feedback_user
  ON reflection_feedback(user_id, created_at DESC);

-- 3. ai_insights insight_type constraint fix
ALTER TABLE ai_insights DROP CONSTRAINT IF EXISTS ai_insights_insight_type_check;
ALTER TABLE ai_insights
  ADD CONSTRAINT ai_insights_insight_type_check
  CHECK (insight_type IN ('reflection', 'pattern', 'weekly_summary', 'burnout_warning', 'encouragement', 'daily_summary'));
