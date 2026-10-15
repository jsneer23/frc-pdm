create type robot_kind as enum ('alpha', 'beta', 'competition', 'offseason');
create type part_kind as enum ('face', 'body');
create type part_status as enum ('waiting_on_order', 'ready', 'in_progress', 'completed');
create type export_format as enum ('dwg', 'dxf', 'step');

create table members (
  id               bigint generated always as identity primary key,
  name             text not null,
  auth_user_id     uuid unique references auth.users (id) on delete set null,
  onshape_user_id  text unique,
  created_at       timestamptz not null default now()
);

create table robots (
  id          bigint generated always as identity primary key,
  season      integer not null check (season between 2026 and 2040),
  kind        robot_kind not null,
  code        text not null unique check (code ~ '^[0-9]{2}[A-Z]?$'),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table subsystems (
  id          bigint generated always as identity primary key,
  robot_id    bigint not null references robots (id) on delete restrict,
  code        text not null check (code ~ '^[A-Z]{2,4}$'),
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (robot_id, code)
);

create table materials (
  id     bigint generated always as identity primary key,
  code   text not null unique,
  label  text not null,
  created_at  timestamptz not null default now()
);

create table stocks (
  id            bigint generated always as identity primary key,
  material_id   bigint not null references materials (id) on delete restrict,
  thickness_in  numeric(7, 5) check (thickness_in > 0),
  created_at  timestamptz not null default now(),
  unique nulls not distinct (material_id, thickness_in)
);

create table machines (
  id          bigint generated always as identity primary key,
  code        text not null unique,
  label       text not null,
  file_format export_format not null,
  selection   part_kind,
  created_at  timestamptz not null default now()
);

create table machine_materials (
  machine_id   bigint not null references machines (id) on delete cascade,
  material_id  bigint not null references materials (id) on delete cascade,
  primary key (machine_id, material_id)
);

create table parts (
  id                  bigint generated always as identity primary key,
  subsystem_id        bigint not null references subsystems (id) on delete restrict,
  sequence_number     integer not null check (sequence_number between 1 and 99),
  name                text not null,
  stock_id            bigint not null references stocks (id) on delete restrict,
  machine_id          bigint not null references machines (id) on delete restrict,
  qty                 integer not null default 1 check (qty between 1 and 99),
  status              part_status not null default 'ready',
  manufacturer_id     bigint references members (id) on delete restrict,
  completer_id        bigint references members (id) on delete restrict,
  actual_mass_g       numeric(8, 1) check (actual_mass_g > 0),
  supersedes_part_id  bigint unique references parts (id) on delete restrict,
  deprecated_at       timestamptz,
  created_at          timestamptz not null default now(),
  unique (subsystem_id, sequence_number),
  check (status <> 'completed' or (completer_id is not null and actual_mass_g is not null)),
  check (supersedes_part_id <> id)
);

create table part_exports (
  id               bigint generated always as identity primary key,
  part_id          bigint not null unique references parts (id) on delete cascade,
  onshape_user_id  text not null,
  document_id      text not null,
  workspace_id     text not null,
  element_id       text not null,
  selection_id     text not null,
  microversion_id  text not null,
  configuration    text,
  kind             part_kind not null,
  file_format      export_format not null,
  file_path        text,
  cad_mass_g       numeric(8, 1) check (cad_mass_g > 0),
  exported_at      timestamptz not null default now()
);

create index part_exports_onshape_idx
  on part_exports (document_id, element_id, selection_id);

create view parts_with_number
with (security_invoker = true) as
select
  p.*,
  'GWHS' || r.code || '-' || s.code || '-P' || lpad(p.sequence_number::text, 2, '0')
    as part_number
from parts p
join subsystems s on s.id = p.subsystem_id
join robots r on r.id = s.robot_id;

create table part_status_events (
  id          bigint generated always as identity primary key,
  part_id     bigint not null references parts (id) on delete cascade,
  status      part_status not null,
  member_id   bigint references members (id) on delete restrict,
  changed_at  timestamptz not null default now()
);

create index part_status_events_part_idx
  on part_status_events (part_id, changed_at);

alter table robots              enable row level security;
alter table subsystems          enable row level security;
alter table members            enable row level security;
alter table materials          enable row level security;
alter table stocks             enable row level security;
alter table machines           enable row level security;
alter table machine_materials  enable row level security;
alter table parts              enable row level security;
alter table part_exports       enable row level security;
alter table part_status_events enable row level security;