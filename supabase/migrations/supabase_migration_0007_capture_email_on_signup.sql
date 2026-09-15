-- ============================================================================
-- 0007 — Capture email and full name during signup
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    role,
    full_name,
    phone,
    email
  )
  values (
    new.id,
    'client'::public.user_role,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.email
  );

  return new;
end;
$$;

select 'Migration 0007 completed successfully' as status;