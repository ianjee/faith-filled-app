-- ============================================================================
-- 0005 — Fix "relation clinics does not exist" during signup
-- ============================================================================
-- Root cause: handle_new_client_profile() (from migration 0002) referenced
-- bare table names (clinics, clients) instead of schema-qualified ones
-- (public.clinics, public.clients). That function runs inside the signup
-- trigger chain under Supabase's supabase_auth_admin role, whose session
-- search_path doesn't include `public` by default — so the unqualified
-- names failed to resolve, the whole transaction rolled back, and GoTrue
-- reported the generic "Database error saving new user".
--
-- Fix: fully qualify every table reference and pin search_path explicitly,
-- matching the pattern already used by private.auth_role() etc.
-- ============================================================================

create or replace function public.handle_new_client_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clinic_id uuid;
begin
  if new.role = 'client' then
    select id into v_clinic_id from public.clinics order by created_at asc limit 1;

    if new.clinic_id is null then
      update public.profiles set clinic_id = v_clinic_id where id = new.id;
    end if;

    insert into public.clients (id, clinic_id)
      values (new.id, coalesce(new.clinic_id, v_clinic_id))
      on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

-- Trigger definition itself doesn't need to change, but re-creating it is
-- harmless and guarantees it's pointing at the updated function.
drop trigger if exists on_client_profile_created on public.profiles;
create trigger on_client_profile_created
after insert on public.profiles
for each row execute function public.handle_new_client_profile();

-- Sanity check: confirm a clinic actually exists (the underlying bug in
-- 0002 masked whether this step ever succeeded). If this returns 0 rows,
-- run the INSERT below.
select * from public.clinics order by created_at asc limit 1;

-- Uncomment and run only if the query above returned zero rows:
-- insert into public.organizations (name) values ('Faith-Filled Wellness');
-- insert into public.clinics (organization_id, name)
--   values ((select id from public.organizations order by created_at desc limit 1), 'Faith-Filled Bodywork');

select 'Migration 0005 completed successfully' as status;