/*
  # Fix handle_new_user security issues

  ## Changes
  1. Drop the dependent trigger first, then recreate the function with immutable search_path
  2. Revoke EXECUTE from anon and authenticated roles to prevent REST API execution
  3. Recreate the trigger

  ## Security
  - Function now has SET search_path = '' (immutable, prevents search path injection)
  - anon and authenticated can no longer call this SECURITY DEFINER function via /rest/v1/rpc
  - The trigger still works because it runs as the function owner (postgres)
*/

-- Drop trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Replace function with immutable search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Revoke EXECUTE from anon and authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
