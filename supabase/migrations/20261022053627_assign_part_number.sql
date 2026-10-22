-- set default to zero for generated typescript types
-- adjust part number constraint to allow 3 digits
-- default 0 doesn't trigger check because trigger function
-- never allows default to be set
alter table public.parts
    alter column sequence_number set default 0,
    drop constraint parts_sequence_number_check,
    add constraint parts_sequence_number_check
    check (sequence_number between 1 and 999);

-- adjust part number view to account for part number schema changes
create or replace view public.parts_with_number
with (security_invoker = true)
as
select
    p.*,
    r.code || '-' || s.code || '-P' || lpad(p.sequence_number::text, 3, '0')
        as part_number
from parts p
join subsystems s on s.id = p.subsystem_id
join robots r on r.id = s.robot_id;


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