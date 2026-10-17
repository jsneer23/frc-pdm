alter policy "Anyone can read machine materials" on public.machine_materials to authenticated;
alter policy "Anyone can read machines" on public.machines to authenticated;
alter policy "Anyone can read materials" on public.materials to authenticated;
alter policy "Anyone can read part exports" on public.part_exports to authenticated;
alter policy "Anyone can read status events" on public.part_status_events to authenticated;
alter policy "Anyone can read parts" on public.parts to authenticated;
alter policy "Anyone can read robots" on public.robots to authenticated;
alter policy "Anyone can read stocks" on public.stocks to authenticated;
alter policy "Anyone can read subsystems" on public.subsystems to authenticated;