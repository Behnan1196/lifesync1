-- =========================================================
-- LifeSync PM REFINEMENT — Member Listing & Removal Security
-- Adds:
--  - list_online_project_members RPC (secure member listing with directory info)
--  - Improved SELECT policy for online_project_members (allows owners to see all)
-- =========================================================

BEGIN;

-- 1) RPC to list members with full directory info
CREATE OR REPLACE FUNCTION public.list_online_project_members(
  p_online_project_id uuid
)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  is_owner boolean,
  member_created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor uuid;
BEGIN
  v_actor := auth.uid();
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Security: Only members or project/org owners can list
  IF NOT EXISTS (
    SELECT 1 FROM public.online_project_members opm 
    WHERE opm.online_project_id = p_online_project_id AND opm.user_id = v_actor
  ) AND NOT EXISTS (
    SELECT 1 FROM public.online_projects op 
    WHERE op.id = p_online_project_id AND op.owner_user_id = v_actor
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    u.id AS user_id,
    COALESCE(ud.email, u.email) AS email,
    ud.full_name,
    (op.owner_user_id = u.id) AS is_owner,
    COALESCE(opm.created_at, op.created_at) AS member_created_at
  FROM auth.users u
  JOIN public.online_projects op ON op.id = p_online_project_id
  LEFT JOIN public.online_project_members opm ON opm.user_id = u.id AND opm.online_project_id = p_online_project_id
  LEFT JOIN public.user_directory ud ON ud.user_id = u.id
  WHERE opm.user_id IS NOT NULL OR op.owner_user_id = u.id
  ORDER BY (op.owner_user_id = u.id) DESC, 2 ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_online_project_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_online_project_members(uuid) TO authenticated;

-- 2) Improve RLS for easier frontend joins (optional but recommended)
DROP POLICY IF EXISTS "opm_select_self" ON public.online_project_members;
CREATE POLICY "opm_select_member_or_owner"
  ON public.online_project_members FOR SELECT
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.online_projects op 
      WHERE op.id = online_project_members.online_project_id 
      AND op.owner_user_id = auth.uid()
    )
  );

COMMIT;
