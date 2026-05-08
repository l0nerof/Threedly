alter table public.profiles
  add constraint profiles_specializations_check
  check (
    specializations <@ array['furniture','decor','materials','lighting','kitchen','bathroom','exterior','plants','technology']::text[]
  );
