-- =========================================================
-- LifeSync Agenda Enhancements — Meta & Status
-- Adds:
--  - status (todo/done) to items
--  - metadata (jsonb) for types (Note, Task, Appt, List) and breakdowns
-- =========================================================

BEGIN;

-- private_items enhancement
ALTER TABLE public.private_items 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'todo',
ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- online_items enhancement
ALTER TABLE public.online_items 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'todo',
ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- Optional: Index on status for performance
CREATE INDEX IF NOT EXISTS idx_pi_status ON public.private_items(status);
CREATE INDEX IF NOT EXISTS idx_oi_status ON public.online_items(status);

COMMIT;
