-- ============================================================================
-- 0005 — Fix staff management DELETE permission
-- ============================================================================

-- Your project stores the helper functions in the private schema.
-- Therefore we MUST use private.auth_role() and private.auth_clinic_id().

drop policy if exists "therapists_admin_delete"
on public.therapists;

create policy "therapists_admin_delete"
on public.therapists
for delete
using (
  private.auth_role() in ('owner', 'admin')
  and clinic_id = private.auth_clinic_id()
);

select 'Migration 0005 completed successfully' as status;