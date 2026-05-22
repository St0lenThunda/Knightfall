-- Knightfall Database Migration: Fix Curriculum Progress Tracking
-- 
-- Dropping the foreign key constraint from user_skill_progress to skill_nodes.
-- This allows us to track completion progress of quests defined in frontend stores
-- without needing duplicate/synced rows in the skill_nodes table.

ALTER TABLE public.user_skill_progress 
DROP CONSTRAINT IF EXISTS user_skill_progress_node_id_fkey;
