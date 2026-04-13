-- 1. Create table for tracking individual puzzle attempts
CREATE TABLE puzzle_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id TEXT NOT NULL,
  solved BOOLEAN NOT NULL,
  attempts INTEGER DEFAULT 1,
  time_taken_seconds INTEGER,
  hints_used INTEGER DEFAULT 0,
  themes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add an explicit puzzle rating column to profiles (if tracking standard rating separately)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS puzzle_rating INTEGER DEFAULT 1200;

-- 3. Add location column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- 3. Enable Row-Level Security for Puzzle Attempts
ALTER TABLE puzzle_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own attempts"
  ON puzzle_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own attempts"
  ON puzzle_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Create table for spaced repetition queue
CREATE TABLE IF NOT EXISTS puzzle_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id TEXT NOT NULL,
  next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  interval_days NUMERIC DEFAULT 0,
  ease_factor NUMERIC DEFAULT 2.5,
  repetition INTEGER DEFAULT 0,
  UNIQUE(user_id, puzzle_id)
);

ALTER TABLE puzzle_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own queue"
  ON puzzle_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own queue"
  ON puzzle_queue FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
