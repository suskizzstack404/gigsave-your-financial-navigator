-- Backfill missing profiles for any existing auth.users rows that predate
-- (or somehow missed) the on_auth_user_created bootstrap trigger.
--
-- Root cause of "Could not save profile: Cannot coerce the result to a
-- single JSON object": profileService.update() ran a plain UPDATE ... .single()
-- against public.profiles. If a user's id had no matching profiles row,
-- the UPDATE matched zero rows and PostgREST's .single() coercion threw.
-- The application-side fix (see src/services/authService.ts) switches that
-- call to an upsert so it self-heals going forward. This migration closes
-- the gap for accounts that already exist without a profile row.
--
-- Safe to run multiple times: profiles.id is the primary key, and this only
-- inserts rows for ids that don't already have one.
INSERT INTO public.profiles (id, full_name)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1), '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
