-- Replace each "for all" admin policy with separate insert, update, and delete policies

-- robots
drop policy "Admins can manage robots" on public.robots;

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
drop policy "Admins can manage subsystems" on public.subsystems;

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
drop policy "Admins can manage materials" on public.materials;

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
drop policy "Admins can manage stocks" on public.stocks;

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
drop policy "Admins can manage machines" on public.machines;

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
drop policy "Admins can manage machine materials" on public.machine_materials;

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
drop policy "Admins can manage members" on public.members;

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

-- Indexes for foreign keys that no other index covers

create index machine_materials_material_id_idx on public.machine_materials (material_id);
create index part_status_events_member_id_idx  on public.part_status_events (member_id);
create index parts_completer_id_idx            on public.parts (completer_id);
create index parts_machine_id_idx              on public.parts (machine_id);
create index parts_manufacturer_id_idx         on public.parts (manufacturer_id);
create index parts_stock_id_idx                on public.parts (stock_id);