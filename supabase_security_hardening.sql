-- Knightfall Security Hardening & Permission Resolution (v0.38.5)
-- Resolves RLS gaps, missing triggers, and constraint issues.

-- 1. PROFILES: Ensure users can manage their own data
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" 
  ON public.profiles FOR DELETE 
  USING (auth.uid() = id);

-- 2. MATCHES: Ensure users can record and view matches
ALTER TABLE IF EXISTS public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
CREATE POLICY "Users can view their own matches" 
  ON public.matches FOR SELECT 
  USING (auth.uid() = white_id OR auth.uid() = black_id);

DROP POLICY IF EXISTS "Users can insert their own matches" ON public.matches;
CREATE POLICY "Users can insert their own matches" 
  ON public.matches FOR INSERT 
  WITH CHECK (auth.uid() = white_id OR auth.uid() = black_id);

-- 3. PUZZLE ATTEMPTS: Add missing DELETE policy for account purging
DROP POLICY IF EXISTS "Users can delete their own attempts" ON public.puzzle_attempts;
CREATE POLICY "Users can delete their own attempts"
  ON public.puzzle_attempts FOR DELETE
  USING (auth.uid() = user_id);

-- 4. COACHING CACHE: Fix constraint for Upsert logic
-- The Edge Function uses upsert(..., { onConflict: 'position_hash' })
-- This requires a UNIQUE constraint, not just an index.
ALTER TABLE public.coaching_cache DROP CONSTRAINT IF EXISTS coaching_cache_position_hash_key;
ALTER TABLE public.coaching_cache ADD CONSTRAINT coaching_cache_position_hash_key UNIQUE (position_hash);

-- 5. SKILL TREE: Allow public read and user-specific progress tracking
ALTER TABLE IF EXISTS public.skill_nodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Skill tree is public" ON public.skill_nodes;
CREATE POLICY "Skill tree is public" ON public.skill_nodes FOR SELECT USING (true);

ALTER TABLE IF EXISTS public.user_skill_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_skill_progress;
CREATE POLICY "Users can view own progress" ON public.user_skill_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.user_skill_progress;
CREATE POLICY "Users can update own progress" ON public.user_skill_progress FOR ALL USING (auth.uid() = user_id);

-- 6. AUTH TRIGGER: Missing on_auth_user_created
-- Ensures that signing up actually creates a public.profiles record.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, rating, hearts, xp)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    1200, 
    5, 
    0
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. GRANTS: Ensure roles have permission to tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
