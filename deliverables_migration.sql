-- Worksy Deliverables Extension Migration
-- Run this block inside your Supabase SQL Editor.

BEGIN;

-- Expand the `proposals` table to store final work deliverables
ALTER TABLE IF EXISTS public.proposals
ADD COLUMN IF NOT EXISTS delivered_work_url TEXT,
ADD COLUMN IF NOT EXISTS delivered_work_notes TEXT;

COMMIT;
