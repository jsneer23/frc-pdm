alter table members
  add column is_admin boolean not null default false;

comment on column members.is_admin is
  'Admins can manage lookup tables, robots, subsystems, and members, and can delete rows.';