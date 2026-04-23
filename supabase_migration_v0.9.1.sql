-- Knightfall Intelligence Layer Migration (v0.9.1)
-- Implements Caching, SRS, and Skill Tree backbone.

-- 1. Coaching Explanation Cache
-- Stores pre-generated LLM outputs to reduce costs and latency.
CREATE TABLE IF NOT EXISTS coaching_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_hash TEXT NOT NULL, -- SHA-256(FEN + theme + type)
    fen TEXT NOT NULL,
    theme TEXT NOT NULL,
    mistake_type TEXT,
    explanation_text TEXT NOT NULL,
    metadata JSONB, -- Stores things like "Beginner" vs "Advanced" variants
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_hash ON coaching_cache(position_hash);

-- Enable RLS and add public access policies for BOTH guest (anon) and logged-in (authenticated) users
ALTER TABLE coaching_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON coaching_cache;
CREATE POLICY "Allow public read access" ON coaching_cache FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON coaching_cache;
CREATE POLICY "Allow public insert access" ON coaching_cache FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Ensure roles have explicit permission to the table
GRANT ALL ON coaching_cache TO anon, authenticated, service_role;

-- 2. SRS & Gamification Tracking
-- Tracks when a user should re-test a specific puzzle or mistake.
DO $$ 
BEGIN
    -- Puzzle SRS columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='puzzle_attempts' AND column_name='next_review_at') THEN
        ALTER TABLE puzzle_attempts 
        ADD COLUMN next_review_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN ease_factor FLOAT DEFAULT 2.5,
        ADD COLUMN interval_days INTEGER DEFAULT 0,
        ADD COLUMN mastery_level INTEGER DEFAULT 0;
    END IF;

    -- Profile Gamification columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='xp') THEN
        ALTER TABLE profiles 
        ADD COLUMN xp INTEGER DEFAULT 0,
        ADD COLUMN hearts INTEGER DEFAULT 5,
        ADD COLUMN streak INTEGER DEFAULT 0,
        ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Skill Tree Nodes
-- For the "Duolingo-style" lesson progression.
CREATE TABLE IF NOT EXISTS skill_nodes (
    id TEXT PRIMARY KEY, -- e.g., 'pins-101'
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- Opening, Tactics, Endgame
    requirements TEXT[], -- IDs of prerequisite nodes
    content_payload JSONB -- Precomputed LLM lesson content
);

-- 4. User Progress in Curriculum
CREATE TABLE IF NOT EXISTS user_skill_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    node_id TEXT REFERENCES skill_nodes(id),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, node_id)
);
