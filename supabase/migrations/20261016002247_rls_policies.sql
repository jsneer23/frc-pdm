create schema if not exists private;

grant usage on schema private to authenticated;

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

-- Lookup tables, robots, and subsystems: anyone reads, admins manage

create policy "Anyone can read robots"
  on public.robots for select
  to anon, authenticated
  using (true);

create policy "Admins can manage robots"
  on public.robots for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Anyone can read subsystems"
  on public.subsystems for select
  to anon, authenticated
  using (true);

create policy "Admins can manage subsystems"
  on public.subsystems for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Anyone can read materials"
  on public.materials for select
  to anon, authenticated
  using (true);

create policy "Admins can manage materials"
  on public.materials for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Anyone can read stocks"
  on public.stocks for select
  to anon, authenticated
  using (true);

create policy "Admins can manage stocks"
  on public.stocks for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Anyone can read machines"
  on public.machines for select
  to anon, authenticated
  using (true);

create policy "Admins can manage machines"
  on public.machines for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Anyone can read machine materials"
  on public.machine_materials for select
  to anon, authenticated
  using (true);

create policy "Admins can manage machine materials"
  on public.machine_materials for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Members: members read, admins manage

create policy "Members can read members"
  on public.members for select
  to authenticated
  using ((select private.is_member()));

create policy "Admins can manage members"
  on public.members for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Parts: anyone reads, members add and update, admins delete

create policy "Anyone can read parts"
  on public.parts for select
  to anon, authenticated
  using (true);

create policy "Members can add parts"
  on public.parts for insert
  to authenticated
  with check ((select private.is_member()));

create policy "Members can update parts"
  on public.parts for update
  to authenticated
  using ((select private.is_member()))
  with check ((select private.is_member()));

create policy "Admins can delete parts"
  on public.parts for delete
  to authenticated
  using ((select private.is_admin()));

-- Part exports: anyone reads, members add and update, admins delete

create policy "Anyone can read part exports"
  on public.part_exports for select
  to anon, authenticated
  using (true);

create policy "Members can add part exports"
  on public.part_exports for insert
  to authenticated
  with check ((select private.is_member()));

create policy "Members can update part exports"
  on public.part_exports for update
  to authenticated
  using ((select private.is_member()))
  with check ((select private.is_member()));

create policy "Admins can delete part exports"
  on public.part_exports for delete
  to authenticated
  using ((select private.is_admin()));

-- Status history: anyone reads, members add, nobody updates, admins delete

create policy "Anyone can read status events"
  on public.part_status_events for select
  to anon, authenticated
  using (true);

create policy "Members can add status events"
  on public.part_status_events for insert
  to authenticated
  with check ((select private.is_member()));

create policy "Admins can delete status events"
  on public.part_status_events for delete
  to authenticated
  using ((select private.is_admin()));