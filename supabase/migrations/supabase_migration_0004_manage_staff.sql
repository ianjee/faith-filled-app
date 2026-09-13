-- ============================================================================
-- 0004 — Support staff management: profiles.email + admin role-update policy
-- ============================================================================
-- CORRECTED: your project's helper functions live under the `private` schema
-- (private.auth_role(), private.auth_clinic_id()), not bare auth_role() /
-- auth_clinic_id() as in the original 0001_v1_schema.sql draft. This version
-- calls them with the private. prefix to match what's actually installed.
--
-- Problem: there's no way to look a person up to promote them (profiles has
-- no email column, and email lives only in auth.users, which the client
-- can't query directly), and no RLS policy lets an owner/admin update
-- someone ELSE's profile — "profiles_self_update" only covers your own row.
-- ============================================================================

-- 0. Safety: make sure `authenticated` can actually call these (idempotent —
--    harmless to re-run even if already granted).
grant execute on function private.auth_role() to authenticated;
grant execute on function private.auth_clinic_id() to authenticated;

-- 1. Add an email column to profiles so admins can search for someone to
--    promote without needing access to auth.users.
alter table profiles add column if not exists email text;
create unique index if not exists profiles_email_idx on profiles (email) where email is not null;

-- 2. Backfill existing profiles from auth.users (run once; harmless to re-run).
update profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

-- 3. Let owner/admin update role (and other fields) on profiles within their
--    own clinic — needed for the Manage Staff screen's promote/demote action.
-- NOTE: this does not distinguish 'owner' vs 'admin' privilege levels, so an
-- 'admin' can currently promote someone all the way to 'owner'. Tighten this
-- later (e.g. require private.auth_role() = 'owner' specifically) once you
-- have more than one staff member with admin access.
drop policy if exists "profiles_admin_update_role" on profiles;
create policy "profiles_admin_update_role"
on profiles
for update
using (
  private.auth_role() in ('owner', 'admin')
  and clinic_id = private.auth_clinic_id()
)
with check (
  private.auth_role() in ('owner', 'admin')
  and clinic_id = private.auth_clinic_id()
);

-- 4. Let owner/admin create/update the therapists row for someone in their
--    clinic — needed when promoting a client to 'therapist' (the app also
--    needs a matching therapists table row, not just profiles.role).
drop policy if exists "therapists_admin_write" on therapists;
create policy "therapists_admin_write"
on therapists
for insert
with check (
  private.auth_role() in ('owner', 'admin')
  and clinic_id = private.auth_clinic_id()
);

drop policy if exists "therapists_admin_update" on therapists;
create policy "therapists_admin_update"
on therapists
for update
using (
  private.auth_role() in ('owner', 'admin')
  and clinic_id = private.auth_clinic_id()
)
with check (
  private.auth_role() in ('owner', 'admin')
  and clinic_id = private.auth_clinic_id()
);

select 'Migration 0004 completed successfully' as status;