/*
# Add delete_user_data function

## Overview
Adds a SECURITY DEFINER function that a user can call to permanently delete
all of their application data (journal entries, mood entries, insights,
reflection feedback, and profile). This powers the "Delete all my data"
button in Settings. The auth account itself is signed out afterwards on the
client; deleting the auth.users row is left to the existing FK cascade when
the account is eventually removed, and the app data is gone immediately.

## What it deletes
Derives the target id from auth.uid() (never from a parameter):
1. reflection_feedback rows for the user
2. ai_insights rows for the user
3. journal_entries rows for the user
4. mood_entries rows for the user
5. the user's profile row

## Security
- SECURITY DEFINER so the user can delete all their related rows in one
  atomic call without needing per-table grants beyond what they have.
- SET search_path = public.
- The actor is always auth.uid(); there is no userId parameter to forge.
- REVOKE EXECUTE from anon/public; GRANT to authenticated only.

## Notes
- Idempotent: safe to re-run. Returns {"deleted": true, "user_id": "..."}.
- Irreversible; the UI confirms with a dialog before calling.
*/

CREATE OR REPLACE FUNCTION public.delete_user_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.reflection_feedback WHERE user_id = v_uid;
  DELETE FROM public.ai_insights WHERE user_id = v_uid;
  DELETE FROM public.journal_entries WHERE user_id = v_uid;
  DELETE FROM public.mood_entries WHERE user_id = v_uid;
  DELETE FROM public.profiles WHERE id = v_uid;

  RETURN json_build_object('deleted', true, 'user_id', v_uid);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_user_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_data() TO authenticated;
