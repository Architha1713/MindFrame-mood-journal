/*
  # Add unique constraints for proper upsert support

  ## Changes
  1. Add UNIQUE constraint on mood_entries(user_id, entry_date) so daily mood upsert works correctly
  2. Add UNIQUE constraint on journal_entries(user_id, entry_date) so daily journal upsert works correctly

  ## Notes
  - These constraints ensure a user can only have one mood entry and one journal entry per day
  - This is required for the ON CONFLICT upsert pattern used in the frontend
*/

ALTER TABLE mood_entries
  ADD CONSTRAINT mood_entries_user_date_unique UNIQUE (user_id, entry_date);

ALTER TABLE journal_entries
  ADD CONSTRAINT journal_entries_user_date_unique UNIQUE (user_id, entry_date);
