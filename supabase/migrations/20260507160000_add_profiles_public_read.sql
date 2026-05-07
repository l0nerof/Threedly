create policy "Profiles are publicly readable"
  on public.profiles
  for select
  to anon, authenticated
  using (true);
