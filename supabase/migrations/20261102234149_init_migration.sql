-- create private schema

create schema if not exists private;

grant usage on schema private to authenticated;

-- enumerated types

create type robot_kind as enum ('alpha', 'beta', 'competition', 'offseason');
create type part_kind as enum ('face', 'body');
create type part_status as enum ('waiting_on_order', 'ready', 'in_progress', 'completed');
create type export_format as enum ('dwg', 'dxf', 'step');
create type export_status as enum ('exporting', 'done', 'failed');

-- tables

-- members

create table public.members (
  id               bigint generated always as identity primary key,
  name             text not null,
  is_admin         boolean not null default false,
  auth_user_id     uuid unique references auth.users (id) on delete set null,
  created_at       timestamptz not null default now()
);

comment on column public.members.is_admin is
  'Admins can manage lookup tables, robots, subsystems, and members, and can delete rows.';

alter table public.members enable row level security;
revoke all on public.members from anon, authenticated;
grant select, insert, update, delete on public.members to authenticated;

-- robots

create table public.robots (
  id          bigint generated always as identity primary key,
  season      integer not null check (season between 2026 and 2040),
  kind        robot_kind not null,
  code        text not null unique check (code ~ '^[0-9]{2}[A-Z]?$'),
  name        text not null,
  created_at  timestamptz not null default now()
);
alter table public.robots enable row level security;
revoke all on public.robots from anon, authenticated;
grant select, insert, update, delete on public.robots to authenticated;
grant select on public.robots to service_role;

-- subsystems

create table public.subsystems (
  id          bigint generated always as identity primary key,
  robot_id    bigint not null references public.robots (id) on delete restrict,
  code        text not null check (code ~ '^[A-Z]{2,4}$'),
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (robot_id, code)
);
alter table public.subsystems enable row level security;
revoke all on public.subsystems from anon, authenticated;
grant select, insert, update, delete on public.subsystems to authenticated;
grant select on public.subsystems to service_role;

-- materials

create table public.materials (
  id     bigint generated always as identity primary key,
  code   text not null unique,
  label  text not null,
  created_at  timestamptz not null default now()
);
alter table public.materials enable row level security;
revoke all on public.materials from anon, authenticated;
grant select, insert, update, delete on public.materials to authenticated;

-- stocks

create table public.stocks (
  id            bigint generated always as identity primary key,
  material_id   bigint not null references public.materials (id) on delete restrict,
  thickness_in  numeric(7, 5) check (thickness_in > 0),
  created_at  timestamptz not null default now(),
  unique nulls not distinct (material_id, thickness_in)
);
alter table public.stocks enable row level security;
revoke all on public.stocks from anon, authenticated;
grant select, insert, update, delete on public.stocks to authenticated;

-- machines

create table public.machines (
  id          bigint generated always as identity primary key,
  code        text not null unique,
  label       text not null,
  file_format export_format not null,
  selection   part_kind,
  created_at  timestamptz not null default now()
);
alter table public.machines enable row level security;
revoke all on public.machines from anon, authenticated;
grant select, insert, update, delete on public.machines to authenticated;

-- machine_materials

create table public.machine_materials (
  machine_id   bigint not null references public.machines (id) on delete cascade,
  material_id  bigint not null references public.materials (id) on delete cascade,
  primary key (machine_id, material_id)
);
alter table public.machine_materials enable row level security;
revoke all on public.machine_materials from anon, authenticated;
grant select, insert, update, delete on public.machine_materials to authenticated;

create index machine_materials_material_id_idx on public.machine_materials (material_id);

-- parts

-- set sequence_number default to zero for better typing in
-- generated typescript types. the default doesn't cause a check error
-- because trigger function always replaces it and triggers run before checks
create table public.parts (
  id                  bigint generated always as identity primary key,
  subsystem_id        bigint not null references public.subsystems (id) on delete restrict,
  sequence_number     integer not null default 0 check (sequence_number between 1 and 999),
  name                text not null,
  stock_id            bigint not null references public.stocks (id) on delete restrict,
  machine_id          bigint not null references public.machines (id) on delete restrict,
  qty                 integer not null default 1 check (qty between 1 and 99),
  status              part_status not null default 'ready',
  exporter_id         bigint references public.members (id) on delete restrict,
  manufacturer_id     bigint references public.members (id) on delete restrict,
  completer_id        bigint references public.members (id) on delete restrict,
  cad_mass_g          numeric(8, 1) check (cad_mass_g > 0),
  actual_mass_g       numeric(8, 1) check (actual_mass_g > 0),
  supersedes_part_id  bigint unique references public.parts (id) on delete restrict,
  deprecated_at       timestamptz,
  created_at          timestamptz not null default now(),
  unique (subsystem_id, sequence_number),
  check (status <> 'completed' or (completer_id is not null and actual_mass_g is not null)),
  check (supersedes_part_id <> id)
);
alter table public.parts enable row level security;
revoke all on public.parts from anon, authenticated;
grant select,insert, delete on public.parts to authenticated;
-- notice this doesn't let admins edit part numbers since they are also authenticated
grant update (name, qty, status, manufacturer_id, completer_id,
              actual_mass_g, cad_mass_g) on public.parts to authenticated;
grant select on public.parts to service_role;

create index parts_completer_id_idx            on public.parts (completer_id);
create index parts_machine_id_idx              on public.parts (machine_id);
create index parts_manufacturer_id_idx         on public.parts (manufacturer_id);
create index parts_stock_id_idx                on public.parts (stock_id);

-- parts_with_number view of parts

create view public.parts_with_number
with (security_invoker = true)
as
select
    p.*,
    r.code || '-' || s.code || '-P' || lpad(p.sequence_number::text, 3, '0')
        as part_number
from public.parts p
join public.subsystems s on s.id = p.subsystem_id
join public.robots r on r.id = s.robot_id;

alter view public.parts_with_number owner to postgres;

revoke all on public.parts_with_number from anon, authenticated;
grant select on public.parts_with_number to service_role, authenticated;

-- part_exports

create table public.part_exports (
  id               bigint generated always as identity primary key,
  part_id          bigint not null unique references public.parts (id) on delete cascade,
  document_id      text not null constraint part_exports_document_id_format check (document_id ~ '^[0-9a-f]{24}$'),
  workspace_id     text not null constraint part_exports_workspace_id_format check (workspace_id ~ '^[0-9a-f]{24}$'),
  element_id       text not null constraint part_exports_element_id_format check (element_id ~ '^[0-9a-f]{24}$'),
  selection_id     text not null constraint part_exports_selection_id_format check (selection_id ~ '^[!-~]{1,100}$'),
  microversion_id  text not null constraint part_exports_microversion_id_format check (microversion_id ~ '^[0-9a-f]{24}$'),
  occurrence_path  text not null check (occurrence_path <> '')
    constraint part_exports_occurrence_path_format
      check(char_length(occurrence_path) <= 500
        and occurrence_path ~ '^[!-~]+$'
        and occurrence_path ~ '^[^.]+(\.[^.]+)*$'
      ),
  translation_id   text unique,
  status           export_status not null default 'exporting',
  failure_reason   text,
  configuration    text,
  kind             part_kind not null,
  file_format      export_format not null,
  file_path        text,
  exported_at      timestamptz not null default now()
);
alter table public.part_exports enable row level security;
revoke all on public.part_exports from anon, authenticated;
grant select, delete on public.part_exports to authenticated;
grant select, insert, update on public.part_exports to service_role;

create index part_exports_onshape_idx
  on public.part_exports (document_id, element_id, selection_id);

-- part_status_events

create table public.part_status_events (
  id          bigint generated always as identity primary key,
  part_id     bigint not null references public.parts (id) on delete cascade,
  status      part_status not null,
  member_id   bigint references public.members (id) on delete restrict,
  changed_at  timestamptz not null default now()
);
alter table public.part_status_events enable row level security;
revoke all on public.part_status_events from anon, authenticated;
grant select on public.part_status_events to authenticated;

create index part_status_events_member_id_idx  on public.part_status_events (member_id);

create index part_status_events_part_idx
  on public.part_status_events (part_id, changed_at);

-- functions

-- assign unique part number trigger function

create function private.assign_part_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$

declare
    next_number integer;

begin
    -- locks the subsystem row in subsystems table with "for update"
    perform 1
    from public.subsystems
    where id = new.subsystem_id
    for update;

    if not found then
        raise exception 'subsystem % does not exist', new.subsystem_id;
    end if;

    -- get highest part number used so far, or 0 if there are no parts
    select coalesce(max(sequence_number), 0) + 1
    into next_number
    from public.parts
    where subsystem_id = new.subsystem_id;

    if next_number > 999 then
        raise exception 'subsystem % has no part numbers left', new.subsystem_id;
    end if;

    -- overwrite the part number already in the request
    new.sequence_number := next_number;
  return new;
end;
$$;

-- prevent trigger function from being called directly
-- can only be called on inserts per trigger below
revoke execute on function private.assign_part_number()
    from public, anon, authenticated;

-- attach trigger function to the table - runs once for each row being inserted
create trigger assign_part_number
    before insert on public.parts
    for each row
    execute function private.assign_part_number();

-- is_member and is_admin authentication for rls policies

create function private.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members
    where auth_user_id = (select auth.uid())
  );
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members
    where auth_user_id = (select auth.uid())
      and is_admin
  );
$$;

revoke execute on function private.is_member() from public;
revoke execute on function private.is_admin()  from public;
grant  execute on function private.is_member() to authenticated;
grant  execute on function private.is_admin()  to authenticated;

-- supabase creates public.rls_auto_enable() on hosted projects (an event
-- trigger function); our migrations never create it, so it is missing on the
-- local stack. Functions in public can be called through the Data API, and
-- new functions are executable by everyone, so take execute away from the
-- API roles. The existence check lets the same migration run locally, where
-- this block does nothing.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable()
      from public, anon, authenticated;
  end if;
end
$$;

-- rls policies

-- admin 

-- robots

create policy "Admins can add robots"
  on public.robots for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update robots"
  on public.robots for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins can delete robots"
  on public.robots for delete
  to authenticated
  using ((select private.is_admin()));

-- subsystems

create policy "Admins can add subsystems"
  on public.subsystems for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update subsystems"
  on public.subsystems for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins can delete subsystems"
  on public.subsystems for delete
  to authenticated
  using ((select private.is_admin()));

-- materials

create policy "Admins can add materials"
  on public.materials for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update materials"
  on public.materials for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins can delete materials"
  on public.materials for delete
  to authenticated
  using ((select private.is_admin()));

-- stocks

create policy "Admins can add stocks"
  on public.stocks for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update stocks"
  on public.stocks for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins can delete stocks"
  on public.stocks for delete
  to authenticated
  using ((select private.is_admin()));

-- machines

create policy "Admins can add machines"
  on public.machines for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update machines"
  on public.machines for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins can delete machines"
  on public.machines for delete
  to authenticated
  using ((select private.is_admin()));

-- machine_materials

create policy "Admins can add machine materials"
  on public.machine_materials for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update machine materials"
  on public.machine_materials for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins can delete machine materials"
  on public.machine_materials for delete
  to authenticated
  using ((select private.is_admin()));

-- members

create policy "Admins can add members"
  on public.members for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update members"
  on public.members for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins can delete members"
  on public.members for delete
  to authenticated
  using ((select private.is_admin()));

-- parts

create policy "Admins can delete parts"
  on public.parts for delete
  to authenticated
  using ((select private.is_admin()));

-- part exports

create policy "Admins can delete part exports"
  on public.part_exports for delete
  to authenticated
  using ((select private.is_admin()));

-- authenticated user policies

-- members can read only

create policy "Members can read robots"
  on public.robots for select
  to authenticated
  using ((select private.is_member()));

create policy "Members can read subsystems"
  on public.subsystems for select
  to authenticated
  using ((select private.is_member()));

create policy "Members can read materials"
  on public.materials for select
  to authenticated
  using ((select private.is_member()));

create policy "Members can read stocks"
  on public.stocks for select
  to authenticated
  using ((select private.is_member()));

create policy "Members can read machines"
  on public.machines for select
  to authenticated
  using ((select private.is_member()));

create policy "Members can read machine materials"
  on public.machine_materials for select
  to authenticated
  using ((select private.is_member()));

create policy "Members can read members"
  on public.members for select
  to authenticated
  using ((select private.is_member()));

create policy "Members can read part exports"
  on public.part_exports for select
  to authenticated
  using ((select private.is_member()));

create policy "Members can read part files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'part-files'
  and (select private.is_member())
);

create policy "Members can read status events"
  on public.part_status_events for select
  to authenticated
  using ((select private.is_member()));

-- read, add, and update

create policy "Members can read parts"
  on public.parts for select
  to authenticated
  using ((select private.is_member()));

create policy "Members can add parts"
  on public.parts for insert
  to authenticated
  with check ((select private.is_member()));

create policy "Members can update parts"
  on public.parts for update
  to authenticated
  using ((select private.is_member()))
  with check ((select private.is_member()));


-- buckets

-- private bucket for exported part files
-- webhook uploads with admin client
-- members can only read
insert into storage.buckets (id, name, public, file_size_limit)
values ('part-files', 'part-files', false, 20 * 1024 * 1024);

-- reference data

insert into public.materials (code, label) values
  ('srpp',             'SRPP'),
  ('polycarbonate',    'Polycarbonate'),
  ('wood',             'Plywood'),
  ('al6061',           'Aluminum 6061'),
  ('al7075',           'Aluminum 7075'),
  ('al5052',           'Aluminum 5052'),
  ('tpu',              'TPU (95A)'),
  ('petg',             'PETG'),
  ('pla',              'PLA+'),
  ('nylon',            'NYLON'),
  ('onyx',             'Onyx (Markforged Only)'),
  ('tube_2x1_7075',    '2x1 7075 (black)'),
  ('tube_2x1_punched', '2x1 Punched'),
  ('tube_2x1_blank',   '2x1 Blank'),
  ('tube_1x1_punched', '1x1 Punched'),
  ('tube_1x1_blank',   '1x1 Blank'),
  ('maxtube_2x1',      '2x1 Maxtube'),
  ('maxtube_1x1',      '1x1 Maxtube'),
  ('alu_maxspline',    'Maxspline'),
  ('poly_maxspline',   'Polycarbonate Maxspline'),
  ('hex_0500_159',     '1/2" Hex (WCP)');

insert into public.stocks (material_id, thickness_in)
select m.id, v.thickness_in
from (values
  ('srpp',             0.25),
  ('polycarbonate',    0.118),
  ('polycarbonate',    0.196),
  ('polycarbonate',    0.236),
  ('al6061',           0.125),
  ('al6061',           0.1875),
  ('al6061',           0.25),
  ('tube_2x1_7075',    0.0625),
  ('tube_2x1_punched', 0.0625),
  ('tube_2x1_punched', 0.09375),
  ('tube_2x1_punched', 0.125),
  ('tube_2x1_blank',   0.0625),
  ('tube_2x1_blank',   0.125),
  ('tube_1x1_punched', 0.0625),
  ('tube_1x1_punched', 0.125),
  ('tube_1x1_blank',   0.0625),
  ('tube_1x1_blank',   0.125),
  ('maxtube_2x1',      0.04),
  ('maxtube_2x1',      0.125),
  ('maxtube_1x1',      0.04),
  ('maxtube_1x1',      0.125),
  ('tpu',              null),
  ('petg',             null),
  ('pla',              null),
  ('nylon',            null),
  ('onyx',             null),
  ('alu_maxspline',    null),
  ('poly_maxspline',   null),
  ('hex_0500_159',     null)
) as v (code, thickness_in)
join public.materials m on m.code = v.code;

insert into public.machines (code, label, file_format, selection) values
  ('saw',       'Chop Saw',   'dwg',  null),
  ('co2_laser', 'CO2 Laser',  'dxf',  'face'),
  ('router',    'Router',     'step', 'body'),
  ('printer',   '3D Printer', 'step', 'body'),
  ('lathe',     'Lathe',      'dwg',  null);

insert into public.machine_materials (machine_id, material_id)
select ma.id, mt.id
from (values
  ('saw',       'tube_2x1_7075'),
  ('saw',       'tube_2x1_punched'),
  ('saw',       'tube_2x1_blank'),
  ('saw',       'tube_1x1_punched'),
  ('saw',       'tube_1x1_blank'),
  ('saw',       'maxtube_2x1'),
  ('saw',       'maxtube_1x1'),
  ('saw',       'alu_maxspline'),
  ('saw',       'poly_maxspline'),
  ('co2_laser', 'srpp'),
  ('co2_laser', 'polycarbonate'),
  ('co2_laser', 'wood'),
  ('router',    'srpp'),
  ('router',    'polycarbonate'),
  ('router',    'wood'),
  ('router',    'al6061'),
  ('router',    'al7075'),
  ('router',    'al5052'),
  ('printer',   'tpu'),
  ('printer',   'petg'),
  ('printer',   'pla'),
  ('printer',   'nylon'),
  ('printer',   'onyx'),
  ('lathe',     'hex_0500_159')
) as v (machine_code, material_code)
join public.machines ma on ma.code = v.machine_code
join public.materials mt on mt.code = v.material_code;