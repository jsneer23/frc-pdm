-- local test user
INSERT INTO auth.users(instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'test@example.com', extensions.crypt('local-test-password', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '');

INSERT INTO auth.identities(id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'email', '{"sub":"11111111-1111-1111-1111-111111111111","email":"test@example.com","email_verified":true}', now(), now(), now());

INSERT INTO public.members(name, email, auth_user_id)
  VALUES ('Test Member', 'test@example.com', '11111111-1111-1111-1111-111111111111');

-- local test robot so you can click submit button
WITH new_robot AS (
INSERT INTO public.robots(code, name, season, kind)
  VALUES
    ('26O', 'Peter Piper', 2026, 'offseason')
  RETURNING
    id)
  INSERT INTO public.subsystems(robot_id, code, name)
  SELECT
    new_robot.id,
    s.code,
    s.name
  FROM
    new_robot
    CROSS JOIN (
      VALUES ('CHS', 'Chassis'),
('PIV', 'Pivot'),
('ELV', 'Elevator'),
('ITK', 'Intake'),
('CLM', 'Climber')) AS s(code, name);

-- ---------------------------------------------------------------------------
-- queue test data (T84)
-- parts in every status and every export state, for building the queue pages
-- ---------------------------------------------------------------------------
-- shop members with no account: they appear in the manufacturer and
-- completer pickers but cannot sign in (the shared shop laptop case)
INSERT INTO public.members(name, email)
VALUES
  -- test members
('Jeremy', 'jeremy@example.com'),
('Jia', 'jia@example.com'),
('Beverly', 'beverly@example.com');

-- act as the test account for the rest of the file. assign_exporter_id fills
-- parts.exporter_id from auth.uid() and rejects a caller with no member row;
-- seed.sql has no signed-in user, so auth.uid() would be null. auth.uid()
-- reads the "sub" claim from this setting. false = for the whole session,
-- because each statement may run in its own transaction. reset at the end.
SELECT
  set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', FALSE);

-- one row per part, in the order part numbers should be assigned. final
-- status, people, and export state are applied after the insert so the status
-- history trigger records a realistic sequence of events.
-- cad_lb is converted to grams the same way the onshape function does.
-- file_state applies to STEP machines only (router, printer); other machines
-- always get a failed export, matching the onshape function (T07).
CREATE TEMPORARY TABLE seed_parts(
  ord integer GENERATED ALWAYS AS IDENTITY,
  name text PRIMARY KEY,
  subsystem text NOT NULL,
  machine text NOT NULL,
  material text NOT NULL,
  thickness_in numeric,
  qty integer NOT NULL,
  cad_lb numeric NOT NULL,
  final_status part_status NOT NULL,
  manufacturer text,
  completer text,
  actual_g numeric,
  file_state export_status,
  failure_reason text,
  deprecated boolean NOT NULL DEFAULT FALSE
);

INSERT INTO seed_parts(name, subsystem, machine, material, thickness_in, qty, cad_lb, final_status, manufacturer, completer, actual_g, file_state, failure_reason, deprecated)
VALUES
  -- chassis
('Bellypan', 'CHS', 'router', 'polycarbonate', 0.118, 1, 1.9, 'ready', NULL, NULL, NULL, 'done', NULL, FALSE),
('Front bumper bracket', 'CHS', 'router', 'al6061', 0.125, 4, 0.21, 'in_progress', 'jia@example.com', NULL, NULL, 'done', NULL, FALSE),
('Corner gusset', 'CHS', 'router', 'al6061', 0.1875, 8, 0.06, 'completed', 'jeremy@example.com', 'jeremy@example.com', 28.4, 'done', NULL, FALSE),
('Frame rail long', 'CHS', 'saw', 'tube_2x1_punched', 0.0625, 2, 1.35, 'completed', 'beverly@example.com', 'jia@example.com', 640.0, NULL, NULL, FALSE),
('Frame rail short', 'CHS', 'saw', 'tube_2x1_punched', 0.0625, 2, 0.9, 'ready', NULL, NULL, NULL, NULL, NULL, FALSE),
  -- pivot
('Pivot plate', 'PIV', 'router', 'al6061', 0.25, 2, 1.1, 'in_progress', 'beverly@example.com', NULL, NULL, 'done', NULL, FALSE),
('Pivot spacer', 'PIV', 'printer', 'pla', NULL, 6, 0.02, 'ready', NULL, NULL, NULL, 'exporting', NULL, FALSE),
('Pivot shaft', 'PIV', 'lathe', 'hex_0500_159', NULL, 1, 0.45, 'waiting_on_order', NULL, NULL, NULL, NULL, NULL, FALSE),
('Pivot hardstop', 'PIV', 'printer', 'tpu', NULL, 2, 0.03, 'ready', NULL, NULL, NULL, 'failed', 'Onshape could not translate the part.', FALSE),
  -- elevator: the old carriage plate comes first so it gets the lower number
('Carriage plate v1', 'ELV', 'router', 'al6061', 0.1875, 1, 1.7, 'ready', NULL, NULL, NULL, 'done', NULL, TRUE),
('Carriage plate', 'ELV', 'router', 'al6061', 0.1875, 1, 1.6, 'ready', NULL, NULL, NULL, 'done', NULL, FALSE),
('Stage tube', 'ELV', 'saw', 'maxtube_2x1', 0.04, 2, 0.75, 'ready', NULL, NULL, NULL, NULL, NULL, FALSE),
('Cable guide', 'ELV', 'printer', 'petg', NULL, 4, 0.04, 'completed', 'jia@example.com', 'beverly@example.com', 17.9, 'done', NULL, FALSE),
  -- intake
('Intake side plate', 'ITK', 'co2_laser', 'polycarbonate', 0.236, 2, 0.35, 'ready', NULL, NULL, NULL, NULL, NULL, FALSE),
('Roller hub', 'ITK', 'printer', 'nylon', NULL, 6, 0.05, 'in_progress', 'jeremy@example.com', NULL, NULL, 'done', NULL, FALSE),
('Intake bumper', 'ITK', 'router', 'srpp', 0.25, 1, 0.4, 'waiting_on_order', NULL, NULL, NULL, 'done', NULL, FALSE);

-- insert every part as ready (the column default). the triggers assign the
-- part number, the exporter, check the machine can cut the material, and
-- record the first status event. "is not distinct from" matches null
-- thicknesses (filament, hex), where "=" would never be true.
INSERT INTO public.parts(subsystem_id, name, stock_id, machine_id, qty, cad_mass_g)
SELECT
  sub.id,
  sp.name,
  st.id,
  ma.id,
  sp.qty,
  round(sp.cad_lb * 453.59237, 1)
FROM
  seed_parts sp
  JOIN public.subsystems sub ON sub.code = sp.subsystem
  JOIN public.robots r ON r.id = sub.robot_id
    AND r.code = '26O'
  JOIN public.machines ma ON ma.code = sp.machine
  JOIN public.materials mat ON mat.code = sp.material
  JOIN public.stocks st ON st.material_id = mat.id
    AND st.thickness_in IS NOT DISTINCT FROM sp.thickness_in
  ORDER BY
    sp.ord;

-- an inner join silently drops a row whose code or thickness doesn't match.
-- fail loudly instead, naming the parts that went missing.
DO $$
DECLARE
  missing text;
BEGIN
  SELECT
    string_agg(sp.name, ', ')
  INTO
    missing
  FROM
    seed_parts sp
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        public.parts p
      WHERE
        p.name = sp.name);
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'seed parts not inserted (check subsystem, machine, material, thickness): %', missing;
  END IF;
END
$$;

-- status changes, in the order they happen in the shop. each real change adds
-- one part_status_events row (record_status_on_update), so a completed part
-- ends with ready -> in_progress -> completed.
-- parts are matched by name, which is unique in this file.
-- 1. started (includes parts that will be completed next)
UPDATE
  public.parts p
SET
  status = 'in_progress',
  manufacturer_id = m.id
FROM
  seed_parts sp
  JOIN public.members m ON m.email = sp.manufacturer
WHERE
  p.name = sp.name
  AND sp.final_status IN ('in_progress', 'completed');

-- 2. completed: the check on parts requires completer_id and actual_mass_g
-- in the same update as the status
UPDATE
  public.parts p
SET
  status = 'completed',
  completer_id = m.id,
  actual_mass_g = sp.actual_g
FROM
  seed_parts sp
  JOIN public.members m ON m.email = sp.completer
WHERE
  p.name = sp.name
  AND sp.final_status = 'completed';

-- 3. stock not in the shop yet
UPDATE
  public.parts p
SET
  status = 'waiting_on_order'
FROM
  seed_parts sp
WHERE
  p.name = sp.name
  AND sp.final_status = 'waiting_on_order';

-- 4. replaced by a newer part (members cannot set deprecated_at; the seed runs
-- as the table owner, which RLS and column grants don't limit)
UPDATE
  public.parts p
SET
  deprecated_at = now()
FROM
  seed_parts sp
WHERE
  p.name = sp.name
  AND sp.deprecated;

-- export rows, one per part. the onshape function writes these as
-- service_role; the seed can because it runs as the owner.
-- fake but well-formed onshape ids pass the 24-hex checks.
-- kind copies the machine's selection; check_export_kind accepts any kind for
-- machines without one (saw, lathe), so those get 'body'.
-- non-STEP machines never reach onshape (T07): failed, no translation id.
INSERT INTO public.part_exports(part_id, document_id, workspace_id, element_id, selection_id, microversion_id, occurrence_path, translation_id, status, failure_reason, kind, file_format)
SELECT
  p.id,
  'aaaaaaaaaaaaaaaaaaaaaaaa',
  'bbbbbbbbbbbbbbbbbbbbbbbb',
  'cccccccccccccccccccccccc',
  'JH' || p.id,
  'dddddddddddddddddddddddd',
  'Mseed' || p.id,
  CASE WHEN ma.file_format = 'step' THEN
    'fake-seed-' || p.id
  END,
  CASE WHEN ma.file_format = 'step' THEN
    sp.file_state
  ELSE
    'failed'
  END,
  CASE WHEN ma.file_format = 'step' THEN
    sp.failure_reason
  ELSE
    upper(ma.file_format::text) || ' export isn''t supported yet; export it by hand'
  END,
  coalesce(ma.selection, 'body'),
  ma.file_format
FROM
  seed_parts sp
  JOIN public.parts p ON p.name = sp.name
  JOIN public.machines ma ON ma.id = p.machine_id;

-- finished exports get the path the webhook would have written:
-- <export id>/<part number>.zip. the export id only exists after the insert.
-- no file is uploaded, so downloading these fails until T88 adds one.
UPDATE
  public.part_exports e
SET
  file_path = e.id || '/' || pwn.part_number || '.zip'
FROM
  public.parts_with_number pwn
WHERE
  pwn.id = e.part_id
  AND e.status = 'done';

DROP TABLE seed_parts;

-- stop acting as the test account
SELECT
  set_config('request.jwt.claims', '', FALSE);

