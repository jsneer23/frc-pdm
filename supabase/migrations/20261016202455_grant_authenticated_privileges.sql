revoke all on public.robots, public.subsystems, public.members,
  public.materials, public.stocks, public.machines, public.machine_materials,
  public.parts, public.part_exports, public.part_status_events,
  public.parts_with_number from anon, authenticated;

grant select, insert, update, delete on public.robots, public.subsystems,
  public.members, public.materials, public.stocks, public.machines,
  public.machine_materials, public.parts, public.part_exports to authenticated;

grant select, insert, delete on public.part_status_events to authenticated;

grant select on public.parts_with_number to authenticated;