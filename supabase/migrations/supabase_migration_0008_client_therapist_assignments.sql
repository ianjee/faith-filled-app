-- ============================================================================
-- 0008 — Admin client/therapist assignment management
-- ============================================================================
-- The base schema already contains client_therapist_assignments, but the
-- original RLS setup does not give owner/admin users permission to insert,
-- delete, or read assignment rows from the app.
--
-- This migration allows owner/admin users to manage assignments inside their
-- own clinic. Therapists can read their own assignment rows so the relationship
-- can also be used by therapist-facing screens later.
-- ============================================================================

alter table public.client_therapist_assignments enable row level security;

drop policy if exists "client_therapist_assignments_admin_select"
on public.client_therapist_assignments;

create policy "client_therapist_assignments_admin_select"
on public.client_therapist_assignments
for select
using (
  private.auth_role() in ('owner', 'admin')
  and client_id in (
    select id from public.clients
    where clinic_id = private.auth_clinic_id()
  )
  and therapist_id in (
    select id from public.therapists
    where clinic_id = private.auth_clinic_id()
  )
);

drop policy if exists "client_therapist_assignments_therapist_select"
on public.client_therapist_assignments;

create policy "client_therapist_assignments_therapist_select"
on public.client_therapist_assignments
for select
using (therapist_id = auth.uid());

drop policy if exists "client_therapist_assignments_admin_insert"
on public.client_therapist_assignments;

create policy "client_therapist_assignments_admin_insert"
on public.client_therapist_assignments
for insert
with check (
  private.auth_role() in ('owner', 'admin')
  and client_id in (
    select id from public.clients
    where clinic_id = private.auth_clinic_id()
  )
  and therapist_id in (
    select id from public.therapists
    where clinic_id = private.auth_clinic_id()
  )
);

drop policy if exists "client_therapist_assignments_admin_delete"
on public.client_therapist_assignments;

create policy "client_therapist_assignments_admin_delete"
on public.client_therapist_assignments
for delete
using (
  private.auth_role() in ('owner', 'admin')
  and client_id in (
    select id from public.clients
    where clinic_id = private.auth_clinic_id()
  )
  and therapist_id in (
    select id from public.therapists
    where clinic_id = private.auth_clinic_id()
  )
);

select 'Migration 0008 completed successfully' as status;
