-- ============================================================================
-- 0002 — Auto-provision the `clients` row alongside `profiles` on signup
-- ============================================================================
-- Problem: intake_forms, health_histories, consents, appointments, surveys,
-- and photos all reference clients(id) — not profiles(id) directly — and
-- clients.clinic_id is NOT NULL. A client who just self-registers only gets
-- a `profiles` row, so every one of those inserts fails with a foreign-key
-- violation until a matching `clients` row (with a clinic_id) exists.
--
-- Fix: make sure at least one clinic exists, then auto-create the `clients`
-- row (assigned to that clinic) whenever a new client profile is inserted.
-- This assumes a single-clinic setup for now — see the note at the bottom
-- for what changes once you're onboarding multiple clinics.
-- ============================================================================

-- 1. Ensure at least one organization + clinic exists to assign new clients to.
do $$
declare
  v_org_id uuid;
begin
  if not exists (select 1 from clinics) then
    insert into organizations (name) values ('Faith-Filled Wellness')
      returning id into v_org_id;
    insert into clinics (organization_id, name)
      values (v_org_id, 'Faith-Filled Bodywork');
  end if;
end $$;

-- 2. Whenever a profile with role = 'client' is created without a clinic_id
--    already set, assign it to the (first) clinic and create the matching
--    `clients` row so intake/health-history/consent/survey inserts succeed.
create or replace function handle_new_client_profile() returns trigger
language plpgsql security definer as $$
declare
  v_clinic_id uuid;
begin
  if new.role = 'client' then
    select id into v_clinic_id from clinics order by created_at asc limit 1;

    if new.clinic_id is null then
      update profiles set clinic_id = v_clinic_id where id = new.id;
    end if;

    insert into clients (id, clinic_id)
      values (new.id, coalesce(new.clinic_id, v_clinic_id))
      on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_client_profile_created on profiles;
create trigger on_client_profile_created
after insert on profiles
for each row execute function handle_new_client_profile();

-- 3. Backfill: if you already created a test account before running this,
--    give it a clients row too so it stops erroring.
insert into clients (id, clinic_id)
select p.id, (select id from clinics order by created_at asc limit 1)
from profiles p
where p.role = 'client'
  and not exists (select 1 from clients c where c.id = p.id);

-- ----------------------------------------------------------------------------
-- NOTE for when you have multiple clinics:
-- Once therapists/admins are managing more than one clinic, replace step 2's
-- "assign to the first clinic" logic with a real clinic-selection step during
-- registration (e.g. an invite code or clinic picker), and pass that clinic_id
-- into the profiles insert instead of defaulting here.
-- ----------------------------------------------------------------------------

select 'Migration 0002 completed successfully' as status;
