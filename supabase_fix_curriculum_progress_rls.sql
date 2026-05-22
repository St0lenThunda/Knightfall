-- Knightfall Database Migration: Fix Curriculum Progress Row-Level Security (RLS)
--
-- Ensures that logged-in (authenticated) users can insert, select, and manage
-- their own curriculum lesson/quest progress.

-- 1. Ensure Row-Level Security is enabled on the table
ALTER TABLE public.user_skill_progress ENABLE ROW LEVEL SECURITY;

-- 2. Drop any legacy/misconfigured policies on this table
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_skill_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_skill_progress;
DROP POLICY IF EXISTS "Users can select own progress" ON public.user_skill_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_skill_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON public.user_skill_progress;

-- 3. Create clean, explicit, and secure policies for authenticated users

-- Allow users to view their own progress (required for path & sanctum renders)
CREATE POLICY "Users can select own progress" 
  ON public.user_skill_progress 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow users to record new lesson completions (required when passing a quiz)
CREATE POLICY "Users can insert own progress" 
  ON public.user_skill_progress 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own progress (required for account resets or purging)
CREATE POLICY "Users can delete own progress" 
  ON public.user_skill_progress 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 4. Grant explicit DML access on the table to standard roles
GRANT SELECT, INSERT, DELETE ON public.user_skill_progress TO authenticated;
GRANT ALL ON public.user_skill_progress TO service_role;
