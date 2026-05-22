-- Knightfall Administrative Role, Purge Control, and RLS Resolution (v0.42.1)
-- Sets up administrative tracking, resolves missing columns, and configures secure RLS permissions.

-- 1. Ensure the 'role' and 'created_at' columns exist in public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Backfill existing rows to avoid NULL values
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;
UPDATE public.profiles SET created_at = now() WHERE created_at IS NULL;

-- 3. Promote the designated admin user (designation tracked in DB, not hardcoded in client)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'tonym415@gmail.com';

-- 4. Implement RLS helper function
-- Runs with SECURITY DEFINER to bypass RLS checks and prevent infinite recursion
-- when querying the public.profiles table from within the RLS policy itself.
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Configure Row Level Security (RLS) policies on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow administrators to SELECT all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 6. Implement the admin purge RPC
-- Runs with SECURITY DEFINER privileges to allow modifying both the public schema
-- tables and the auth.users table in a single atomic transaction.
CREATE OR REPLACE FUNCTION public.admin_purge_user(target_user_id UUID)
RETURNS void AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- A. Security: Determine if the executing user has admin rights
  SELECT role INTO caller_role 
  FROM public.profiles 
  WHERE id = auth.uid();

  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators with the admin role can execute this action.';
  END IF;

  -- B. Safety: Prevent an admin from purging their own account accidentally
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Safety Lock: You cannot purge your own account via this command. Use regular user account deletion instead.';
  END IF;

  -- C. Wipe Public Data: Clean up tables in the public schema manually
  -- (Matches, Puzzle Attempts, SRS queue, Skill progression, and Profile)
  DELETE FROM public.matches 
  WHERE white_id = target_user_id OR black_id = target_user_id;

  DELETE FROM public.puzzle_attempts 
  WHERE user_id = target_user_id;

  DELETE FROM public.puzzle_queue 
  WHERE user_id = target_user_id;

  DELETE FROM public.user_skill_progress 
  WHERE user_id = target_user_id;

  DELETE FROM public.profiles 
  WHERE id = target_user_id;

  -- D. Wipe Auth Credentials: Delete from auth.users schema
  -- This blocks the user from logging in again since the credential is gone.
  DELETE FROM auth.users 
  WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission on the new functions
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_purge_user(UUID) TO authenticated;
