-- create private schema
CREATE SCHEMA IF NOT EXISTS private;

GRANT usage ON SCHEMA private TO authenticated;

-- enumerated types
CREATE TYPE robot_kind AS enum(
  'alpha',
  'beta',
  'competition',
  'offseason'
);

CREATE TYPE part_kind AS enum(
  'face',
  'body'
);

CREATE TYPE part_status AS enum(
  'waiting_on_order',
  'ready',
  'in_progress',
  'completed'
);

CREATE TYPE export_format AS enum(
  'dwg',
  'dxf',
  'step'
);

CREATE TYPE export_status AS enum(
  'exporting',
  'done',
  'failed'
);

-- tables
-- members
CREATE TABLE public.members(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  email text NOT NULL UNIQUE CONSTRAINT members_email_format CHECK (char_length(email) <= 254 AND email LIKE '_%@_%'),
  is_admin boolean NOT NULL DEFAULT FALSE,
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.members.is_admin IS 'Admins can manage lookup tables, robots, subsystems, and members, and can delete rows.';

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.members FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated;

-- robots
CREATE TABLE public.robots(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  season integer NOT NULL CHECK (season BETWEEN 2026 AND 2040),
  kind robot_kind NOT NULL,
  code text NOT NULL UNIQUE CHECK (code ~ '^[0-9]{2}[A-Z]$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- code is a season's last two digits plus a letter for the
  -- robot type. i.e. 27A is 2027 alpha, 26O is 2026 offseason
  -- constraint verifies the kind, season, and code match
  CONSTRAINT robots_code_matches_season_and_kind CHECK (LEFT (code, 2) =
  RIGHT (season::text, 2) AND substr(code, 3) = CASE kind
  WHEN 'alpha' THEN
    'A'
  WHEN 'beta' THEN
    'B'
  WHEN 'competition' THEN
    'C'
  WHEN 'offseason' THEN
    'O'
  ELSE
    '#' -- an unmapped kind matches no code; see below
  END)
);

ALTER TABLE public.robots ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.robots FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.robots TO authenticated;

GRANT SELECT ON public.robots TO service_role;

-- subsystems
CREATE TABLE public.subsystems(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  robot_id bigint NOT NULL REFERENCES public.robots(id) ON DELETE RESTRICT,
  code text NOT NULL CHECK (code ~ '^[A-Z]{2,4}$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (robot_id, code)
);

ALTER TABLE public.subsystems ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.subsystems FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subsystems TO authenticated;

GRANT SELECT ON public.subsystems TO service_role;

-- materials
CREATE TABLE public.materials(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9_]{1,50}$'),
  label text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.materials FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;

-- stocks
CREATE TABLE public.stocks(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  material_id bigint NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  thickness_in numeric(7, 5) CHECK (thickness_in > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE nulls NOT DISTINCT (material_id, thickness_in)
);

ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.stocks FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stocks TO authenticated;

-- machines
CREATE TABLE public.machines(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9_]{1,50}$'),
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 100),
  file_format export_format NOT NULL,
  selection part_kind,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.machines FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.machines TO authenticated;

-- machine_materials
CREATE TABLE public.machine_materials(
  machine_id bigint NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  material_id bigint NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  PRIMARY KEY (machine_id, material_id)
);

ALTER TABLE public.machine_materials ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.machine_materials FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.machine_materials TO authenticated;

CREATE INDEX machine_materials_material_id_idx ON public.machine_materials(material_id);

-- parts
-- set sequence_number default to zero for better typing in
-- generated typescript types. the default doesn't cause a check error
-- because trigger function always replaces it and triggers run before checks
CREATE TABLE public.parts(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id uuid CONSTRAINT parts_request_id_key UNIQUE,
  subsystem_id bigint NOT NULL REFERENCES public.subsystems(id) ON DELETE RESTRICT,
  sequence_number integer NOT NULL DEFAULT 0 CHECK (sequence_number BETWEEN 1 AND 999),
  name text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 100),
  stock_id bigint NOT NULL REFERENCES public.stocks(id) ON DELETE RESTRICT,
  machine_id bigint NOT NULL REFERENCES public.machines(id) ON DELETE RESTRICT,
  qty integer NOT NULL DEFAULT 1 CHECK (qty BETWEEN 1 AND 99),
  status part_status NOT NULL DEFAULT 'ready',
  exporter_id bigint NOT NULL DEFAULT 0 REFERENCES public.members(id) ON DELETE RESTRICT,
  manufacturer_id bigint REFERENCES public.members(id) ON DELETE RESTRICT,
  completer_id bigint REFERENCES public.members(id) ON DELETE RESTRICT,
  cad_mass_g numeric(8, 1) CHECK (cad_mass_g > 0 AND cad_mass_g <= 22679.6),
  actual_mass_g numeric(8, 1) CHECK (actual_mass_g > 0),
  supersedes_part_id bigint UNIQUE REFERENCES public.parts(id) ON DELETE RESTRICT,
  deprecated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subsystem_id, sequence_number),
  CHECK (status <> 'completed' OR (completer_id IS NOT NULL AND actual_mass_g IS NOT NULL)),
  CHECK (supersedes_part_id <> id)
);

ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.parts FROM anon, authenticated;

GRANT SELECT, INSERT, DELETE ON public.parts TO authenticated;

-- notice this doesn't let admins edit part numbers since they are also authenticated
GRANT UPDATE (name, qty, status, manufacturer_id, completer_id, actual_mass_g, cad_mass_g) ON public.parts TO authenticated;

GRANT SELECT ON public.parts TO service_role;

CREATE INDEX exporter_id_idx ON public.parts(exporter_id);

CREATE INDEX parts_manufacturer_id_idx ON public.parts(manufacturer_id);

CREATE INDEX parts_completer_id_idx ON public.parts(completer_id);

CREATE INDEX parts_machine_id_idx ON public.parts(machine_id);

CREATE INDEX parts_stock_id_idx ON public.parts(stock_id);

-- parts_with_number view of parts
CREATE VIEW public.parts_with_number WITH ( security_invoker = TRUE
) AS
SELECT
  p.*,
  r.code || '-' || s.code || '-P' || lpad(
    p.sequence_number::text, 3, '0'
) AS part_number
FROM
  public.parts p
  JOIN public.subsystems s ON s.id = p.subsystem_id
  JOIN public.robots r ON r.id = s.robot_id;

ALTER VIEW public.parts_with_number OWNER TO postgres;

REVOKE ALL ON public.parts_with_number FROM anon, authenticated;

GRANT SELECT ON public.parts_with_number TO service_role, authenticated;

-- part_exports
CREATE TABLE public.part_exports(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  part_id bigint NOT NULL UNIQUE REFERENCES public.parts(id) ON DELETE CASCADE,
  document_id text NOT NULL CONSTRAINT part_exports_document_id_format CHECK (document_id ~ '^[0-9a-f]{24}$'),
  workspace_id text NOT NULL CONSTRAINT part_exports_workspace_id_format CHECK (workspace_id ~ '^[0-9a-f]{24}$'),
  element_id text NOT NULL CONSTRAINT part_exports_element_id_format CHECK (element_id ~ '^[0-9a-f]{24}$'),
  selection_id text NOT NULL CONSTRAINT part_exports_selection_id_format CHECK (selection_id ~ '^[!-~]{1,100}$'),
  microversion_id text NOT NULL CONSTRAINT part_exports_microversion_id_format CHECK (microversion_id ~ '^[0-9a-f]{24}$'),
  occurrence_path text NOT NULL CHECK (occurrence_path <> '') CONSTRAINT part_exports_occurrence_path_format CHECK (char_length(occurrence_path) <= 500 AND occurrence_path ~ '^[!-~]+$' AND occurrence_path ~ '^[^.]+(\.[^.]+)*$'),
  translation_id text UNIQUE CHECK (char_length(translation_id) <= 100),
  status export_status NOT NULL DEFAULT 'exporting',
  failure_reason text CHECK (char_length(failure_reason) <= 1000),
  configuration text CHECK (char_length(configuration) <= 1000),
  kind part_kind NOT NULL,
  file_format export_format NOT NULL,
  file_path text CHECK (char_length(file_path) <= 500),
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts >= 1)
);

ALTER TABLE public.part_exports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.part_exports FROM anon, authenticated;

GRANT SELECT, DELETE ON public.part_exports TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.part_exports TO service_role;

CREATE INDEX part_exports_onshape_idx ON public.part_exports(document_id, element_id, selection_id);

-- part_status_events
CREATE TABLE public.part_status_events(
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  part_id bigint NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  status part_status NOT NULL,
  member_id bigint REFERENCES public.members(id) ON DELETE RESTRICT,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.part_status_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.part_status_events FROM anon, authenticated;

GRANT SELECT ON public.part_status_events TO authenticated;

CREATE INDEX part_status_events_member_id_idx ON public.part_status_events(member_id);

CREATE INDEX part_status_events_part_idx ON public.part_status_events(part_id, changed_at);

-- functions
-- assign exporter id to the member id of the caller
CREATE FUNCTION private.assign_exporter_id()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
  AS $$
DECLARE
  member_id bigint;
BEGIN
  SELECT
    id
  INTO
    member_id
  FROM
    public.members
  WHERE
    auth_user_id =(
      SELECT
        auth.uid());
  IF member_id IS NULL THEN
    RAISE EXCEPTION 'caller is not a member'
      USING errcode = '42501';
  END IF;
  NEW.exporter_id := member_id;
  RETURN NEW;
END;
$$;

-- prevent trigger function from being called directly
-- can only be called on inserts per trigger below
REVOKE EXECUTE ON FUNCTION private.assign_exporter_id() FROM public, anon, authenticated;

-- attach trigger function to the table - runs once for each row being inserted
CREATE TRIGGER assign_exporter_id
  BEFORE INSERT ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION private.assign_exporter_id();

-- assign unique part number trigger function
CREATE FUNCTION private.assign_part_number()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
  AS $$
DECLARE
  next_number integer;
BEGIN
  -- locks the subsystem row in subsystems table with "for update"
  -- needed in case two requests com in at the same time and try to
  -- assign part numbers based of the same current highest
  PERFORM
    1
  FROM
    public.subsystems
  WHERE
    id = NEW.subsystem_id
  FOR UPDATE;
  IF NOT found THEN
    RAISE EXCEPTION 'subsystem % does not exist', NEW.subsystem_id;
  END IF;
  -- get highest part number used so far, or 0 if there are no parts
  SELECT
    coalesce(max(sequence_number), 0) + 1
  INTO
    next_number
  FROM
    public.parts
  WHERE
    subsystem_id = NEW.subsystem_id;
  IF next_number > 999 THEN
    RAISE EXCEPTION 'subsystem % has no part numbers left', NEW.subsystem_id;
  END IF;
  -- overwrite the part number already in the request
  NEW.sequence_number := next_number;
  RETURN NEW;
END;
$$;

-- prevent trigger function from being called directly
-- can only be called on inserts per trigger below
REVOKE EXECUTE ON FUNCTION private.assign_part_number() FROM public, anon, authenticated;

-- attach trigger function to the table - runs once for each row being inserted
CREATE TRIGGER assign_part_number
  BEFORE INSERT ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION private.assign_part_number();

-- is_member and is_admin authentication for rls policies
CREATE FUNCTION private.is_member()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = ''
  AS $$
  SELECT
    EXISTS(
      SELECT
        1
      FROM
        public.members
      WHERE
        auth_user_id =(
          SELECT
            auth.uid()));
$$;

CREATE FUNCTION private.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = ''
  AS $$
  SELECT
    EXISTS(
      SELECT
        1
      FROM
        public.members
      WHERE
        auth_user_id =(
          SELECT
            auth.uid())
          AND is_admin);
$$;

REVOKE EXECUTE ON FUNCTION private.is_member() FROM public;

REVOKE EXECUTE ON FUNCTION private.is_admin() FROM public;

GRANT EXECUTE ON FUNCTION private.is_member() TO authenticated;

GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- supabase creates public.rls_auto_enable() on hosted projects (an event
-- trigger function); our migrations never create it, so it is missing on the
-- local stack. Functions in public can be called through the Data API, and
-- new functions are executable by everyone, so take execute away from the
-- API roles. The existence check lets the same migration run locally, where
-- this block does nothing.
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public, anon, authenticated;
  END IF;
END
$$;

-- part_status trigger function
-- make database write changes to part_status_events upon every status change
CREATE FUNCTION private.record_status_event()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
  AS $$
BEGIN
  INSERT INTO public.part_status_events(part_id, status, member_id)
    VALUES(NEW.id, NEW.status, CASE NEW.status
      WHEN 'in_progress' THEN
        NEW.manufacturer_id
      WHEN 'completed' THEN
        NEW.completer_id
      END);
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.record_status_event() FROM public, anon, authenticated;

CREATE TRIGGER record_status_on_insert
  AFTER INSERT ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION private.record_status_event();

-- AFTER UPDATE OF status doesn't look at if the requested
-- change actually resulted in anything so we have to verify
-- with the WHEN ... IS DISTINCT FROM ... line before
-- writing to status update
CREATE TRIGGER record_status_on_update
  AFTER UPDATE OF status ON public.parts
  FOR EACH ROW
  WHEN(OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION private.record_status_event();

-- set completed_at when status is done or failed and reset
-- when exporting (i.e. a retry)
CREATE FUNCTION private.set_export_completed_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path = ''
  AS $$
BEGIN
  IF NEW.status = 'exporting' THEN
    NEW.completed_at := NULL;
  ELSE
    NEW.completed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.set_export_completed_at() FROM public, anon, authenticated;

-- completed at needs to be called on insert if the insert is already known
-- to be failed (i.e. unsupported file format)
CREATE TRIGGER set_export_completed_at_on_insert
  BEFORE INSERT ON public.part_exports
  FOR EACH ROW
  EXECUTE FUNCTION private.set_export_completed_at();

CREATE TRIGGER set_export_completed_at_on_update
  BEFORE UPDATE OF status ON public.part_exports
  FOR EACH ROW
  WHEN(old.status IS DISTINCT FROM new.status)
  EXECUTE FUNCTION private.set_export_completed_at();

-- sets updated_at on every update
CREATE FUNCTION private.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path = ''
  AS $$
BEGIN
  NEW.updated_at := now();
  RETURN new;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.set_updated_at() FROM public, anon, authenticated;

CREATE TRIGGER set_parts_updated_at
  BEFORE UPDATE ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

-- members/admin table triggers
-- auth_user_id is derived from the auth table and is based on string matching
-- emails between the two tables. requires SECURITY DEFINER because members
-- cannot read the auth schema
CREATE FUNCTION private.link_account_to_member()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
  AS $$
BEGIN
  NEW.email := lower(btrim(NEW.email));
  -- no matching account leaves auth_user_id null
  NEW.auth_user_id :=(
    SELECT
      u.id
    FROM
      auth.users u
    WHERE
      lower(u.email) = NEW.email
      AND NOT u.is_sso_user);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.link_account_to_member() FROM public, anon, authenticated;

-- firing on every update "disallows" edits to auth_user_id, because any
-- edit will always be replaced by a fresh fetch from the trigger function
CREATE TRIGGER link_account_to_member
  BEFORE INSERT OR UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION private.link_account_to_member();

-- link members to account upon account creation/update
-- requires SECURITY DEFINER because it runs as auths database role, which doesn't
-- have access to public.members
CREATE FUNCTION private.link_member_to_account()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
  AS $$
BEGIN
  BEGIN
    -- if a member's auth_user_id points to this account AND the member email
    -- does not match the auth email, remove auth_user_id from that member
    UPDATE
      public.members
    SET
      auth_user_id = NULL
    WHERE
      auth_user_id = NEW.id
      AND email <> lower(NEW.email);
    -- if a member has an email that matches an auth account then set the
    -- auth_user_id to the auth id
    UPDATE
      public.members
    SET
      auth_user_id = NEW.id
    WHERE
      email = lower(NEW.email);
    -- if the above raised an error, creating the account would fail. instead,
    -- every error is caught and logged as a warning. this way the account is
    -- always saved, and a missed link to members can be fixed by re-saving the member.
  EXCEPTION
    WHEN OTHERS THEN
      RAISE warning 'link_member_to_account failed for account %: %', NEW.id, sqlerrm;
  END;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.link_member_to_account() FROM public, anon, authenticated;

CREATE TRIGGER link_member_on_account_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.link_member_to_account();

-- only call trigger function when update actually changes the email
-- needed because auth updates its rows often (i.e. every sign on)
CREATE TRIGGER link_member_on_account_email_change
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN(old.email IS DISTINCT FROM new.email)
  EXECUTE FUNCTION private.link_member_to_account();

-- rls policies
-- admin
-- robots
CREATE POLICY "Admins can add robots" ON public.robots
  FOR INSERT TO authenticated
  WITH CHECK ((
    SELECT
      private.is_admin()));

CREATE POLICY "Admins can update robots" ON public.robots
  FOR UPDATE TO authenticated
  USING ((
    SELECT
      private.is_admin()))
  WITH CHECK ((
    SELECT
      private.is_admin()));

CREATE POLICY "Admins can delete robots" ON public.robots
  FOR DELETE TO authenticated
  USING ((
    SELECT
      private.is_admin()));

-- subsystems
CREATE POLICY "Admins can add subsystems" ON public.subsystems
  FOR INSERT TO authenticated
  WITH CHECK ((
    SELECT
      private.is_admin()));

CREATE POLICY "Admins can update subsystems" ON public.subsystems
  FOR UPDATE TO authenticated
  USING ((
    SELECT
      private.is_admin()))
  WITH CHECK ((
    SELECT
      private.is_admin()));

CREATE POLICY "Admins can delete subsystems" ON public.subsystems
  FOR DELETE TO authenticated
  USING ((
    SELECT
      private.is_admin()));

-- materials
CREATE POLICY "Admins can add materials" ON public.materials
  FOR INSERT TO authenticated
  WITH CHECK ((
    SELECT
      private.is_admin()));

CREATE POLICY "Admins can update materials" ON public.materials
  FOR UPDATE TO authenticated
  USING ((
    SELECT
      private.is_admin()))
  WITH CHECK ((
    SELECT
      private.is_admin()));

CREATE POLICY "Admins can delete materials" ON public.materials
  FOR DELETE TO authenticated
  USING ((
    SELECT
      private.is_admin()));

-- stocks
CREATE POLICY "Admins can add stocks" ON public.stocks
  FOR INSERT TO authenticated
  WITH CHECK ((
    SELECT
      private.is_admin()));

CREATE POLICY "Admins can update stocks" ON public.stocks
  FOR UPDATE TO authenticated
  USING ((
    SELECT
      private.is_admin()))
  WITH CHECK ((
    SELECT
      private.is_admin()));

CREATE POLICY "Admins can delete stocks" ON public.stocks
  FOR DELETE TO authenticated
  USING ((
    SELECT
      private.is_admin()));

-- machines
CREATE POLICY "Admins can add machines" ON public.machines
  FOR INSERT TO authenticated
  WITH CHECK ((
    SELECT
      private.is_admin()));

CREATE POLICY "Admins can update machines" ON public.machines
  FOR UPDATE TO authenticated
  USING ((
    SELECT
      private.is_admin()))
  WITH CHECK ((
    SELECT
      private.is_admin()));

CREATE POLICY "Admins can delete machines" ON public.machines
  FOR DELETE TO authenticated
  USING ((
    SELECT
      private.is_admin()));

-- machine_materials
CREATE POLICY "Admins can add machine materials" ON public.machine_materials
  FOR INSERT TO authenticated
  WITH CHECK ((
    SELECT
      private.is_admin()));

CREATE POLICY "Admins can update machine materials" ON public.machine_materials
  FOR UPDATE TO authenticated
  USING ((
    SELECT
      private.is_admin()))
  WITH CHECK ((
    SELECT
      private.is_admin()));

CREATE POLICY "Admins can delete machine materials" ON public.machine_materials
  FOR DELETE TO authenticated
  USING ((
    SELECT
      private.is_admin()));

-- members
CREATE POLICY "Admins can add members" ON public.members
  FOR INSERT TO authenticated
  WITH CHECK ((
    SELECT
      private.is_admin()));

CREATE POLICY "Admins can update members" ON public.members
  FOR UPDATE TO authenticated
  USING ((
    SELECT
      private.is_admin()))
  WITH CHECK ((
    SELECT
      private.is_admin()));

CREATE POLICY "Admins can delete members" ON public.members
  FOR DELETE TO authenticated
  USING ((
    SELECT
      private.is_admin()));

-- parts
CREATE POLICY "Admins can delete parts" ON public.parts
  FOR DELETE TO authenticated
  USING ((
    SELECT
      private.is_admin()));

-- part exports
CREATE POLICY "Admins can delete part exports" ON public.part_exports
  FOR DELETE TO authenticated
  USING ((
    SELECT
      private.is_admin()));

-- authenticated user policies
-- members can read only
CREATE POLICY "Members can read robots" ON public.robots
  FOR SELECT TO authenticated
  USING ((
    SELECT
      private.is_member()));

CREATE POLICY "Members can read subsystems" ON public.subsystems
  FOR SELECT TO authenticated
  USING ((
    SELECT
      private.is_member()));

CREATE POLICY "Members can read materials" ON public.materials
  FOR SELECT TO authenticated
  USING ((
    SELECT
      private.is_member()));

CREATE POLICY "Members can read stocks" ON public.stocks
  FOR SELECT TO authenticated
  USING ((
    SELECT
      private.is_member()));

CREATE POLICY "Members can read machines" ON public.machines
  FOR SELECT TO authenticated
  USING ((
    SELECT
      private.is_member()));

CREATE POLICY "Members can read machine materials" ON public.machine_materials
  FOR SELECT TO authenticated
  USING ((
    SELECT
      private.is_member()));

CREATE POLICY "Members can read members" ON public.members
  FOR SELECT TO authenticated
  USING ((
    SELECT
      private.is_member()));

CREATE POLICY "Members can read part exports" ON public.part_exports
  FOR SELECT TO authenticated
  USING ((
    SELECT
      private.is_member()));

CREATE POLICY "Members can read part files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'part-files'
    AND (
      SELECT
        private.is_member()));

CREATE POLICY "Members can read status events" ON public.part_status_events
  FOR SELECT TO authenticated
  USING ((
    SELECT
      private.is_member()));

-- read, add, and update
CREATE POLICY "Members can read parts" ON public.parts
  FOR SELECT TO authenticated
  USING ((
    SELECT
      private.is_member()));

CREATE POLICY "Members can add parts" ON public.parts
  FOR INSERT TO authenticated
  WITH CHECK ((
    SELECT
      private.is_member()));

CREATE POLICY "Members can update parts" ON public.parts
  FOR UPDATE TO authenticated
  USING ((
    SELECT
      private.is_member()))
  WITH CHECK ((
    SELECT
      private.is_member()));

-- buckets
-- private bucket for exported part files
-- webhook uploads with admin client
-- members can only read
INSERT INTO storage.buckets(id, name, public, file_size_limit)
  VALUES ('part-files', 'part-files', FALSE, 20 * 1024 * 1024);

-- reference data
INSERT INTO public.materials(code, label)
VALUES
  ('srpp', 'SRPP'),
('polycarbonate', 'Polycarbonate'),
('wood', 'Plywood'),
('al6061', 'Aluminum 6061'),
('al7075', 'Aluminum 7075'),
('al5052', 'Aluminum 5052'),
('tpu', 'TPU (95A)'),
('petg', 'PETG'),
('pla', 'PLA+'),
('nylon', 'NYLON'),
('onyx', 'Onyx (Markforged Only)'),
('tube_2x1_7075', '2x1 7075 (black)'),
('tube_2x1_punched', '2x1 Punched'),
('tube_2x1_blank', '2x1 Blank'),
('tube_1x1_punched', '1x1 Punched'),
('tube_1x1_blank', '1x1 Blank'),
('maxtube_2x1', '2x1 Maxtube'),
('maxtube_1x1', '1x1 Maxtube'),
('alu_maxspline', 'Maxspline'),
('poly_maxspline', 'Polycarbonate Maxspline'),
('hex_0500_159', '1/2" Hex (WCP)');

INSERT INTO public.stocks(material_id, thickness_in)
SELECT
  m.id,
  v.thickness_in
FROM (
  VALUES ('srpp', 0.25),
('polycarbonate', 0.118),
('polycarbonate', 0.196),
('polycarbonate', 0.236),
('al6061', 0.125),
('al6061', 0.1875),
('al6061', 0.25),
('tube_2x1_7075', 0.0625),
('tube_2x1_punched', 0.0625),
('tube_2x1_punched', 0.09375),
('tube_2x1_punched', 0.125),
('tube_2x1_blank', 0.0625),
('tube_2x1_blank', 0.125),
('tube_1x1_punched', 0.0625),
('tube_1x1_punched', 0.125),
('tube_1x1_blank', 0.0625),
('tube_1x1_blank', 0.125),
('maxtube_2x1', 0.04),
('maxtube_2x1', 0.125),
('maxtube_1x1', 0.04),
('maxtube_1x1', 0.125),
('tpu', NULL),
('petg', NULL),
('pla', NULL),
('nylon', NULL),
('onyx', NULL),
('alu_maxspline', NULL),
('poly_maxspline', NULL),
('hex_0500_159', NULL)) AS v(code, thickness_in)
  JOIN public.materials m ON m.code = v.code;

INSERT INTO public.machines(code, label, file_format, selection)
VALUES
  ('saw', 'Chop Saw', 'dwg', NULL),
('co2_laser', 'CO2 Laser', 'dxf', 'face'),
('router', 'Router', 'step', 'body'),
('printer', '3D Printer', 'step', 'body'),
('lathe', 'Lathe', 'dwg', NULL);

INSERT INTO public.machine_materials(machine_id, material_id)
SELECT
  ma.id,
  mt.id
FROM (
  VALUES ('saw', 'tube_2x1_7075'),
('saw', 'tube_2x1_punched'),
('saw', 'tube_2x1_blank'),
('saw', 'tube_1x1_punched'),
('saw', 'tube_1x1_blank'),
('saw', 'maxtube_2x1'),
('saw', 'maxtube_1x1'),
('saw', 'alu_maxspline'),
('saw', 'poly_maxspline'),
('co2_laser', 'srpp'),
('co2_laser', 'polycarbonate'),
('co2_laser', 'wood'),
('router', 'srpp'),
('router', 'polycarbonate'),
('router', 'wood'),
('router', 'al6061'),
('router', 'al7075'),
('router', 'al5052'),
('printer', 'tpu'),
('printer', 'petg'),
('printer', 'pla'),
('printer', 'nylon'),
('printer', 'onyx'),
('lathe', 'hex_0500_159')) AS v(machine_code, material_code)
  JOIN public.machines ma ON ma.code = v.machine_code
  JOIN public.materials mt ON mt.code = v.material_code;

