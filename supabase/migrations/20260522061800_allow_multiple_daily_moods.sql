/*
  # Allow multiple mood entries per day

  ## Changes
  1. Remove UNIQUE constraint on mood_entries(user_id, entry_date) so users can log multiple moods throughout the day
  2. Add timestamp column to mood_entries for more precise time tracking
  3. Keep journal_entries unique constraint (one journal per day is fine)

  ## Notes
  - Multiple mood entries per day allows tracking emotional shifts
  - The AI analysis will aggregate all of today's moods for a daily summary
*/

ALTER TABLE mood_entries DROP CONSTRAINT IF EXISTS mood_entries_user_date_unique;
