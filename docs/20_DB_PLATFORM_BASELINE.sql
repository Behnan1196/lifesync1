-- ======================================================================
-- LifeSync DB_PLATFORM_BASELINE v3 (Phase 1) — FINAL (Frame + PM + Sharing)
-- Includes:
--   - organizations + organization_members + RLS + create_organization RPC
--   - PM tables (private/online projects/items) + RLS
--   - Online project sharing via email (owner-only) RPCs
-- Recursion-safe:
--   - organization_members SELECT: self-row only
--   - online_project_members SELECT: self-row only
-- ======================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- 0) GUARDS (prevent old schema mismatch)
-- =========================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='organizations' AND column_name='owner_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='organizations' AND column_name='owner_user_id'
  ) THEN
    RAISE EXCEPTION
      'DB_PLATFORM_BASELINE expects organizations.owner_user_id. Found owner_id. Reset DB or migrate explicitly (not allowed here).';
  END IF;
END $$;

-- =========================================================
-- 1) TABLES — FRAME CORE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- =========================================================
-- 2) TABLES — PM
-- =========================================================
CREATE TABLE IF NOT EXISTS public.private_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.private_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.private_projects(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  scheduled_date date NULL,
  scheduled_time time NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.online_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.online_project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  online_project_id uuid NOT NULL REFERENCES public.online_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(online_project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.online_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  online_project_id uuid NOT NULL REFERENCES public.online_projects(id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  scheduled_date date NULL,
  scheduled_time time NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- 3) RLS ENABLE
-- =========================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.private_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_items ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 4) RPC — create_organization (atomic org + owner membership)
-- =========================================================
CREATE OR REPLACE FUNCTION public.create_organization(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.organizations (name, owner_user_id)
  VALUES (p_name, auth.uid())
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, auth.uid(), 'owner');

  RETURN v_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_organization(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization(text) TO authenticated;

-- =========================================================
-- 5) RPC — create_online_project
-- =========================================================
CREATE OR REPLACE FUNCTION public.create_online_project(
  p_organization_id uuid,
  p_title text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_project_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_organization_id
      AND om.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;

  INSERT INTO public.online_projects (organization_id, owner_user_id, title)
  VALUES (p_organization_id, auth.uid(), p_title)
  RETURNING id INTO v_project_id;

  INSERT INTO public.online_project_members (online_project_id, user_id)
  VALUES (v_project_id, auth.uid());

  RETURN v_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_online_project(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_online_project(uuid, text) TO authenticated;

-- =========================================================
-- 6) RPC — Online Project Sharing via Email (Owner-only, same org)
-- =========================================================
CREATE OR REPLACE FUNCTION public.add_online_project_member_by_email(
  p_online_project_id uuid,
  p_member_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor_user_id uuid;
  v_org_id uuid;
  v_member_user_id uuid;
BEGIN
  v_actor_user_id := auth.uid();
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- project exists + owner-only
  SELECT p.organization_id
    INTO v_org_id
  FROM public.online_projects p
  WHERE p.id = p_online_project_id
    AND p.owner_user_id = v_actor_user_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Not owner or project not found';
  END IF;

  -- email -> user_id
  SELECT u.id
    INTO v_member_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(trim(p_member_email))
  LIMIT 1;

  IF v_member_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found by email';
  END IF;

  -- do not add owner redundantly
  IF EXISTS (
    SELECT 1
    FROM public.online_projects p
    WHERE p.id = p_online_project_id
      AND p.owner_user_id = v_member_user_id
  ) THEN
    RAISE EXCEPTION 'Owner is already a member';
  END IF;

  -- must be in same org
  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = v_org_id
      AND om.user_id = v_member_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this organization';
  END IF;

  INSERT INTO public.online_project_members (online_project_id, user_id)
  VALUES (p_online_project_id, v_member_user_id)
  ON CONFLICT (online_project_id, user_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.add_online_project_member_by_email(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_online_project_member_by_email(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_online_project_member_by_email(
  p_online_project_id uuid,
  p_member_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor_user_id uuid;
  v_member_user_id uuid;
BEGIN
  v_actor_user_id := auth.uid();
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.online_projects p
    WHERE p.id = p_online_project_id
      AND p.owner_user_id = v_actor_user_id
  ) THEN
    RAISE EXCEPTION 'Not owner or project not found';
  END IF;

  SELECT u.id
    INTO v_member_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(trim(p_member_email))
  LIMIT 1;

  IF v_member_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found by email';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.online_projects p
    WHERE p.id = p_online_project_id
      AND p.owner_user_id = v_member_user_id
  ) THEN
    RAISE EXCEPTION 'Cannot remove owner from project members';
  END IF;

  DELETE FROM public.online_project_members
  WHERE online_project_id = p_online_project_id
    AND user_id = v_member_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_online_project_member_by_email(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_online_project_member_by_email(uuid, text) TO authenticated;

-- =========================================================
-- 7) DROP POLICIES (idempotent)
-- =========================================================
-- FRAME
DROP POLICY IF EXISTS "org_select_owner_or_member" ON public.organizations;
DROP POLICY IF EXISTS "org_update_owner" ON public.organizations;
DROP POLICY IF EXISTS "org_delete_owner" ON public.organizations;

DROP POLICY IF EXISTS "orgm_select_self" ON public.organization_members;
DROP POLICY IF EXISTS "orgm_insert_owner" ON public.organization_members;
DROP POLICY IF EXISTS "orgm_update_owner" ON public.organization_members;
DROP POLICY IF EXISTS "orgm_delete_owner" ON public.organization_members;

-- PM PRIVATE
DROP POLICY IF EXISTS "pp_select_own" ON public.private_projects;
DROP POLICY IF EXISTS "pp_insert_own" ON public.private_projects;
DROP POLICY IF EXISTS "pp_update_own" ON public.private_projects;
DROP POLICY IF EXISTS "pp_delete_own" ON public.private_projects;

DROP POLICY IF EXISTS "pi_select_own" ON public.private_items;
DROP POLICY IF EXISTS "pi_insert_own" ON public.private_items;
DROP POLICY IF EXISTS "pi_update_own" ON public.private_items;
DROP POLICY IF EXISTS "pi_delete_own" ON public.private_items;

-- PM ONLINE
DROP POLICY IF EXISTS "op_select_org_member" ON public.online_projects;
DROP POLICY IF EXISTS "op_update_owner" ON public.online_projects;
DROP POLICY IF EXISTS "op_delete_owner" ON public.online_projects;

DROP POLICY IF EXISTS "opm_select_project_member" ON public.online_project_members; -- legacy
DROP POLICY IF EXISTS "opm_select_self" ON public.online_project_members;
DROP POLICY IF EXISTS "opm_insert_owner" ON public.online_project_members;
DROP POLICY IF EXISTS "opm_delete_owner" ON public.online_project_members;

DROP POLICY IF EXISTS "oi_select_project_member" ON public.online_items;
DROP POLICY IF EXISTS "oi_insert_project_member" ON public.online_items;
DROP POLICY IF EXISTS "oi_update_creator_or_owner_immutable" ON public.online_items; -- legacy
DROP POLICY IF EXISTS "oi_update_creator_or_owner" ON public.online_items;
DROP POLICY IF EXISTS "oi_delete_creator_or_owner" ON public.online_items;

-- =========================================================
-- 8) POLICIES — FRAME CORE
-- =========================================================
CREATE POLICY "org_select_owner_or_member"
  ON public.organizations
  FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
    )
  );

-- NO INSERT policy on organizations (force RPC)
CREATE POLICY "org_update_owner"
  ON public.organizations
  FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "org_delete_owner"
  ON public.organizations
  FOR DELETE
  USING (owner_user_id = auth.uid());

-- organization_members: SELF ROW ONLY SELECT (prevents recursion)
CREATE POLICY "orgm_select_self"
  ON public.organization_members
  FOR SELECT
  USING (user_id = auth.uid());

-- membership management: org owner only (non-recursive)
CREATE POLICY "orgm_insert_owner"
  ON public.organization_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = organization_members.organization_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "orgm_update_owner"
  ON public.organization_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = organization_members.organization_id
        AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = organization_members.organization_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "orgm_delete_owner"
  ON public.organization_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = organization_members.organization_id
        AND o.owner_user_id = auth.uid()
    )
  );

-- =========================================================
-- 9) POLICIES — PM PRIVATE
-- =========================================================
CREATE POLICY "pp_select_own"
  ON public.private_projects FOR SELECT
  USING (owner_user_id = auth.uid());

CREATE POLICY "pp_insert_own"
  ON public.private_projects FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "pp_update_own"
  ON public.private_projects FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "pp_delete_own"
  ON public.private_projects FOR DELETE
  USING (owner_user_id = auth.uid());

CREATE POLICY "pi_select_own"
  ON public.private_items FOR SELECT
  USING (owner_user_id = auth.uid());

CREATE POLICY "pi_insert_own"
  ON public.private_items FOR INSERT
  WITH CHECK (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.private_projects p
      WHERE p.id = private_items.project_id
        AND p.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "pi_update_own"
  ON public.private_items FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.private_projects p
      WHERE p.id = private_items.project_id
        AND p.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "pi_delete_own"
  ON public.private_items FOR DELETE
  USING (owner_user_id = auth.uid());

-- =========================================================
-- 10) POLICIES — PM ONLINE
-- =========================================================
CREATE POLICY "op_select_org_member"
  ON public.online_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = online_projects.organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "op_update_owner"
  ON public.online_projects FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "op_delete_owner"
  ON public.online_projects FOR DELETE
  USING (owner_user_id = auth.uid());

-- online_project_members: SELF ROW ONLY (no recursion)
CREATE POLICY "opm_select_self"
  ON public.online_project_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "opm_insert_owner"
  ON public.online_project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.online_projects p
      WHERE p.id = online_project_members.online_project_id
        AND p.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "opm_delete_owner"
  ON public.online_project_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.online_projects p
      WHERE p.id = online_project_members.online_project_id
        AND p.owner_user_id = auth.uid()
    )
  );

-- online_items
CREATE POLICY "oi_select_project_member"
  ON public.online_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.online_project_members pm
      WHERE pm.online_project_id = online_items.online_project_id
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "oi_insert_project_member"
  ON public.online_items FOR INSERT
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.online_project_members pm
      WHERE pm.online_project_id = online_items.online_project_id
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "oi_update_creator_or_owner"
  ON public.online_items
  FOR UPDATE
  USING (
    created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.online_projects p
      WHERE p.id = online_items.online_project_id
        AND p.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.online_projects p
      WHERE p.id = online_items.online_project_id
        AND p.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "oi_delete_creator_or_owner"
  ON public.online_items FOR DELETE
  USING (
    created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.online_projects p
      WHERE p.id = online_items.online_project_id
        AND p.owner_user_id = auth.uid()
    )
  );


-- =========================================================
-- 11) IDENTITY DIRECTORY (Phase 1.1) — user_directory + RPCs
-- Goal:
--   - Stop UUID-based UX
--   - Enable email-based org membership management (owner-only, recursion-safe)
-- Notes:
--   - Auth user provisioning (create/invite) is NOT possible from DB; it is server-only (service role).
--   - DB handles directory + membership via RPC.
-- =========================================================

-- 11.1 TABLE — user_directory (minimal, extensible)
CREATE TABLE IF NOT EXISTS public.user_directory (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NULL,
  phone text NULL,
  birth_date date NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_directory ENABLE ROW LEVEL SECURITY;

-- 11.2 updated_at trigger (idempotent)
CREATE OR REPLACE FUNCTION public._set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_directory_updated_at ON public.user_directory;
CREATE TRIGGER trg_user_directory_updated_at
BEFORE UPDATE ON public.user_directory
FOR EACH ROW
EXECUTE FUNCTION public._set_updated_at();

-- 11.3 RLS — self row only (admin views via RPC only)
DROP POLICY IF EXISTS "ud_select_self" ON public.user_directory;
CREATE POLICY "ud_select_self"
  ON public.user_directory
  FOR SELECT
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies (force RPC)

-- =========================================================
-- 11.4 RPC — upsert_user_directory_by_email
-- Actor: authenticated caller (typically SuperAdmin/Org owner/admin UI)
-- Behavior:
--   - Finds user_id via auth.users by email
--   - Upserts directory row for that user (email normalized)
-- Security:
--   - SECURITY DEFINER
--   - callable by authenticated
-- =========================================================
CREATE OR REPLACE FUNCTION public.upsert_user_directory_by_email(
  p_email text,
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_birth_date date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor uuid;
  v_user_id uuid;
  v_email text;
BEGIN
  v_actor := auth.uid();
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_email := lower(trim(p_email));
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  SELECT u.id
    INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email) = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found by email';
  END IF;

  INSERT INTO public.user_directory (user_id, email, full_name, phone, birth_date)
  VALUES (v_user_id, v_email, p_full_name, p_phone, p_birth_date)
  ON CONFLICT (email) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, public.user_directory.full_name),
        phone = COALESCE(EXCLUDED.phone, public.user_directory.phone),
        birth_date = COALESCE(EXCLUDED.birth_date, public.user_directory.birth_date);

  -- Ensure email is not pointing to a different user_id
  IF EXISTS (
    SELECT 1
    FROM public.user_directory ud
    WHERE ud.email = v_email
      AND ud.user_id <> v_user_id
  ) THEN
    RAISE EXCEPTION 'Email is already linked to a different user';
  END IF;

  RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_user_directory_by_email(text, text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_user_directory_by_email(text, text, text, date) TO authenticated;

-- =========================================================
-- 11.5 RPC — add_organization_member_by_email (owner-only)
-- - Owner check uses organizations table (non-recursive)
-- - Adds/updates role using email (no UUID UX)
-- - Ensures directory row exists at least with email
-- =========================================================
CREATE OR REPLACE FUNCTION public.add_organization_member_by_email(
  p_organization_id uuid,
  p_member_email text,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor uuid;
  v_org_owner uuid;
  v_member_user_id uuid;
  v_email text;
  v_role text;
BEGIN
  v_actor := auth.uid();
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT o.owner_user_id
    INTO v_org_owner
  FROM public.organizations o
  WHERE o.id = p_organization_id;

  IF v_org_owner IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  IF v_org_owner <> v_actor THEN
    RAISE EXCEPTION 'Only organization owner can manage members';
  END IF;

  v_email := lower(trim(p_member_email));
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Member email is required';
  END IF;

  v_role := lower(trim(p_role));
  IF v_role NOT IN ('admin','member') THEN
    RAISE EXCEPTION 'Invalid role (allowed: admin, member)';
  END IF;

  SELECT u.id
    INTO v_member_user_id
  FROM auth.users u
  WHERE lower(u.email) = v_email
  LIMIT 1;

  IF v_member_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found by email';
  END IF;

  IF v_member_user_id = v_org_owner THEN
    RAISE EXCEPTION 'Owner already exists; cannot assign owner via this RPC';
  END IF;

  -- ensure directory row exists with at least email
  INSERT INTO public.user_directory (user_id, email)
  VALUES (v_member_user_id, v_email)
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (p_organization_id, v_member_user_id, v_role)
  ON CONFLICT (organization_id, user_id) DO UPDATE
    SET role = EXCLUDED.role;
END;
$$;

REVOKE ALL ON FUNCTION public.add_organization_member_by_email(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_organization_member_by_email(uuid, text, text) TO authenticated;

-- =========================================================
-- 11.6 RPC — remove_organization_member_by_email (owner-only)
-- =========================================================
CREATE OR REPLACE FUNCTION public.remove_organization_member_by_email(
  p_organization_id uuid,
  p_member_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor uuid;
  v_org_owner uuid;
  v_member_user_id uuid;
  v_email text;
BEGIN
  v_actor := auth.uid();
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT o.owner_user_id
    INTO v_org_owner
  FROM public.organizations o
  WHERE o.id = p_organization_id;

  IF v_org_owner IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  IF v_org_owner <> v_actor THEN
    RAISE EXCEPTION 'Only organization owner can manage members';
  END IF;

  v_email := lower(trim(p_member_email));
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Member email is required';
  END IF;

  SELECT u.id
    INTO v_member_user_id
  FROM auth.users u
  WHERE lower(u.email) = v_email
  LIMIT 1;

  IF v_member_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found by email';
  END IF;

  IF v_member_user_id = v_org_owner THEN
    RAISE EXCEPTION 'Cannot remove owner from organization';
  END IF;

  DELETE FROM public.organization_members
  WHERE organization_id = p_organization_id
    AND user_id = v_member_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_organization_member_by_email(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_organization_member_by_email(uuid, text) TO authenticated;

-- =========================================================
-- 11.7 RPC — list_organization_members (owner-only)
-- Returns directory info without needing UUID UX
-- =========================================================
CREATE OR REPLACE FUNCTION public.list_organization_members(
  p_organization_id uuid
)
RETURNS TABLE (
  user_id uuid,
  email text,
  role text,
  full_name text,
  phone text,
  birth_date date,
  member_created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor uuid;
  v_org_owner uuid;
BEGIN
  v_actor := auth.uid();
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT o.owner_user_id
    INTO v_org_owner
  FROM public.organizations o
  WHERE o.id = p_organization_id;

  IF v_org_owner IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  IF v_org_owner <> v_actor THEN
    RAISE EXCEPTION 'Only organization owner can list members';
  END IF;

  RETURN QUERY
  SELECT
    om.user_id,
    COALESCE(ud.email, lower(u.email)) AS email,
    om.role,
    ud.full_name,
    ud.phone,
    ud.birth_date,
    om.created_at AS member_created_at
  FROM public.organization_members om
  LEFT JOIN public.user_directory ud ON ud.user_id = om.user_id
  LEFT JOIN auth.users u ON u.id = om.user_id
  WHERE om.organization_id = p_organization_id
  ORDER BY
    CASE om.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
    lower(COALESCE(ud.email, u.email));
END;
$$;

REVOKE ALL ON FUNCTION public.list_organization_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_organization_members(uuid) TO authenticated;

COMMIT;
