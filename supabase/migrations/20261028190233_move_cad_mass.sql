-- add cad_mass_g to parts
alter table public.parts
    add column cad_mass_g numeric(8, 1)
    constraint parts_cad_mass_g_check check (cad_mass_g > 0);

-- remove it from part_exports
alter table public.part_exports
    drop column cad_mass_g;

-- recreate parts view so p.* includes cad_mass_g
drop view public.parts_with_number;

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

-- restore db privileges
revoke all on public.parts_with_number from anon, authenticated;
grant select on public.parts_with_number to authenticated;