-- ============================================================================
-- Therapist Portal — Version 1 (MVP) schema
-- Stack: PostgreSQL via Supabase, Supabase Auth, Row Level Security
-- Built multi-clinic from day one (see APP_INITIAL_PLAN, section 13).
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Roles & organizations
-- ---------------------------------------------------------------------------
create type user_role as enum ('owner', 'admin', 'therapist', 'client');

create table organizations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table clinics (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  address         text,
  created_at      timestamptz not null default now()
);

-- One row per authenticated user, mirrors auth.users
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  clinic_id   uuid references clinics(id) on delete set null,
  role        user_role not null default 'client',
  full_name   text,
  phone       text,
  avatar_path text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Clients & therapists (both are profiles; these tables hold role-specific data)
-- ---------------------------------------------------------------------------
create table clients (
  id           uuid primary key references profiles(id) on delete cascade,
  clinic_id    uuid not null references clinics(id) on delete cascade,
  date_of_birth date,
  emergency_contact text,
  created_at   timestamptz not null default now()
);

create table therapists (
  id           uuid primary key references profiles(id) on delete cascade,
  clinic_id    uuid not null references clinics(id) on delete cascade,
  specialties  text[],
  bio          text,
  created_at   timestamptz not null default now()
);

-- Which therapist(s) a client is assigned to (supports future many-to-many)
create table client_therapist_assignments (
  client_id    uuid not null references clients(id) on delete cascade,
  therapist_id uuid not null references therapists(id) on delete cascade,
  assigned_at  timestamptz not null default now(),
  primary key (client_id, therapist_id)
);

-- ---------------------------------------------------------------------------
-- Intake, health history, consent
-- ---------------------------------------------------------------------------
create table intake_forms (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references clients(id) on delete cascade,
  responses   jsonb not null default '{}',
  submitted_at timestamptz,
  created_at  timestamptz not null default now()
);

create table health_histories (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references clients(id) on delete cascade,
  conditions  text[],
  medications text[],
  notes       text,
  updated_at  timestamptz not null default now()
);

create table consents (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid not null references clients(id) on delete cascade,
  document_name text not null,
  document_version text not null,
  agreed        boolean not null default false,
  agreed_at     timestamptz,
  ip_address    text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Appointments & sessions
-- ---------------------------------------------------------------------------
create type appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');

create table appointments (
  id            uuid primary key default uuid_generate_v4(),
  clinic_id     uuid not null references clinics(id) on delete cascade,
  client_id     uuid not null references clients(id) on delete cascade,
  therapist_id  uuid not null references therapists(id) on delete cascade,
  service_name  text not null,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  status        appointment_status not null default 'scheduled',
  created_at    timestamptz not null default now()
);

-- SOAP note: Subjective / Objective / Assessment / Plan (structured, not free text)
create table soap_notes (
  id             uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  therapist_id   uuid not null references therapists(id) on delete cascade,
  subjective     text,
  pain_before    smallint check (pain_before between 0 and 10),
  objective      text,
  range_of_motion text,
  assessment     text,
  plan_next_treatment text,
  plan_home_care text,
  signed_at      timestamptz,
  created_at     timestamptz not null default now()
);

create table treatment_goals (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid not null references clients(id) on delete cascade,
  soap_note_id  uuid references soap_notes(id) on delete set null,
  goal          text not null,
  target_date   date,
  achieved      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table home_care_recommendations (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid not null references clients(id) on delete cascade,
  soap_note_id  uuid references soap_notes(id) on delete set null,
  instructions  text not null,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Outcome-based post-session survey (the standout feature)
-- ---------------------------------------------------------------------------
create table surveys (
  id               uuid primary key default uuid_generate_v4(),
  appointment_id   uuid not null references appointments(id) on delete cascade,
  client_id        uuid not null references clients(id) on delete cascade,
  pain_before      smallint check (pain_before between 0 and 10),
  pain_after       smallint check (pain_after between 0 and 10),
  sleep_improved   boolean,
  stress_improved  boolean,
  mobility_improved boolean,
  communication_rating smallint check (communication_rating between 1 and 5),
  understood_home_care boolean,
  would_recommend  boolean,
  feedback_text    text,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Photos (posture / range-of-motion) — file lives in Storage, not the DB
-- ---------------------------------------------------------------------------
create table photos (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid not null references clients(id) on delete cascade,
  uploaded_by   uuid not null references profiles(id),
  session_id    uuid references appointments(id) on delete set null,
  storage_path  text not null,
  consent_id    uuid references consents(id),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit log — every sensitive action, for accountability
-- ---------------------------------------------------------------------------
create table audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references profiles(id),
  event       text not null,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table organizations enable row level security;
alter table clinics enable row level security;
alter table profiles enable row level security;
alter table clients enable row level security;
alter table therapists enable row level security;
alter table client_therapist_assignments enable row level security;
alter table intake_forms enable row level security;
alter table health_histories enable row level security;
alter table consents enable row level security;
alter table appointments enable row level security;
alter table soap_notes enable row level security;
alter table treatment_goals enable row level security;
alter table home_care_recommendations enable row level security;
alter table surveys enable row level security;
alter table photos enable row level security;
alter table audit_logs enable row level security;

-- Helper: current user's role + clinic, read once per statement
create or replace function auth_role() returns user_role
language sql stable as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function auth_clinic_id() returns uuid
language sql stable as $$
  select clinic_id from profiles where id = auth.uid()
$$;

create or replace function is_assigned_therapist(p_client_id uuid) returns boolean
language sql stable as $$
  select exists (
    select 1 from client_therapist_assignments
    where client_id = p_client_id and therapist_id = auth.uid()
  )
$$;

-- Profiles: a user reads/updates their own row; owner/admin read their clinic
create policy "profiles_self" on profiles for select using (id = auth.uid());
create policy "profiles_self_update" on profiles for update using (id = auth.uid());
create policy "profiles_clinic_admin" on profiles for select using (
  auth_role() in ('owner', 'admin') and clinic_id = auth_clinic_id()
);

-- Clients: client sees own row; assigned therapist sees theirs; owner/admin see clinic
create policy "clients_self" on clients for select using (id = auth.uid());
create policy "clients_therapist" on clients for select using (is_assigned_therapist(id));
create policy "clients_admin" on clients for select using (
  auth_role() in ('owner', 'admin') and clinic_id = auth_clinic_id()
);

-- Therapists: visible to themselves and to owner/admin of the same clinic
create policy "therapists_self" on therapists for select using (id = auth.uid());
create policy "therapists_admin" on therapists for select using (
  auth_role() in ('owner', 'admin') and clinic_id = auth_clinic_id()
);

-- Intake / health history / consents / photos: client owns, assigned therapist reads, admin reads clinic
create policy "intake_client" on intake_forms for select using (client_id = auth.uid());
create policy "intake_client_write" on intake_forms for insert with check (client_id = auth.uid());
create policy "intake_therapist" on intake_forms for select using (is_assigned_therapist(client_id));
create policy "intake_admin" on intake_forms for select using (
  auth_role() in ('owner', 'admin')
  and client_id in (select id from clients where clinic_id = auth_clinic_id())
);

create policy "health_history_client" on health_histories for select using (client_id = auth.uid());
create policy "health_history_client_write" on health_histories for all using (client_id = auth.uid());
create policy "health_history_therapist" on health_histories for select using (is_assigned_therapist(client_id));

create policy "consents_client" on consents for select using (client_id = auth.uid());
create policy "consents_client_write" on consents for insert with check (client_id = auth.uid());

create policy "photos_client" on photos for select using (client_id = auth.uid());
create policy "photos_therapist" on photos for select using (is_assigned_therapist(client_id));
create policy "photos_upload" on photos for insert with check (
  uploaded_by = auth.uid() and (client_id = auth.uid() or is_assigned_therapist(client_id))
);

-- Appointments: client sees own, therapist sees assigned, admin sees clinic
create policy "appointments_client" on appointments for select using (client_id = auth.uid());
create policy "appointments_therapist" on appointments for select using (therapist_id = auth.uid());
create policy "appointments_admin" on appointments for select using (
  auth_role() in ('owner', 'admin') and clinic_id = auth_clinic_id()
);

-- SOAP notes: therapist who wrote it, plus clinic admin — never the client directly
create policy "soap_notes_therapist" on soap_notes for all using (therapist_id = auth.uid());
create policy "soap_notes_admin" on soap_notes for select using (
  auth_role() in ('owner', 'admin')
  and appointment_id in (
    select id from appointments where clinic_id = auth_clinic_id()
  )
);

-- Treatment goals & home care: client reads own, assigned therapist manages
create policy "goals_client" on treatment_goals for select using (client_id = auth.uid());
create policy "goals_therapist" on treatment_goals for all using (is_assigned_therapist(client_id));
create policy "homecare_client" on home_care_recommendations for select using (client_id = auth.uid());
create policy "homecare_therapist" on home_care_recommendations for all using (is_assigned_therapist(client_id));

-- Surveys: client submits their own; therapist + admin can read (never edit)
create policy "surveys_client_write" on surveys for insert with check (client_id = auth.uid());
create policy "surveys_client_read" on surveys for select using (client_id = auth.uid());
create policy "surveys_therapist_read" on surveys for select using (is_assigned_therapist(client_id));
create policy "surveys_admin_read" on surveys for select using (
  auth_role() in ('owner', 'admin')
  and client_id in (select id from clients where clinic_id = auth_clinic_id())
);

-- Audit logs: write-only for the app, read-only for owner/admin
create policy "audit_insert" on audit_logs for insert with check (actor_id = auth.uid());
create policy "audit_admin_read" on audit_logs for select using (auth_role() in ('owner', 'admin'));
