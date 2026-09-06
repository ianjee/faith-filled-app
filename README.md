# Therapist Portal — Version 1 (MVP)

Cross-platform (iOS + Android) client & therapist portal, built with the stack recommended
in the App Initial Plan: **React Native + Expo + TypeScript + Supabase (PostgreSQL, Auth,
Storage)**. Multi-clinic from day one; role-based access enforced with Postgres Row Level
Security, not just in the app.

This scaffold implements the **Version 1 / MVP** feature set:

- **Client** — account, intake form, health history, e-consent, appointment history,
  home-care recommendations, outcome-based post-session survey.
- **Therapist** — today's schedule, assigned client list, client profile (intake + health
  history + consent status), structured SOAP notes (draft → sign).
- **Admin / Owner** — clinic dashboard (client/therapist/session counts), client list,
  therapist list, basic outcome reports, settings.

Messaging, AI-assisted SOAP drafts, per-therapist analytics, and multi-clinic org switching
are intentionally **out of scope for V1** — see the roadmap deck for V2/V3.

## Getting started

```bash
npm install
cp .env.example .env        # fill in your Supabase project URL + anon key
```

1. Create a free Supabase project at supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_v1_schema.sql` — this creates every
   table, enum, and Row Level Security policy used by this app.
3. Create your first organization/clinic row, then sign up through the app and manually
   set that user's `role` to `owner` and `clinic_id` in the `profiles` table so the admin
   portal has something to show.
4. Start the app:

```bash
npx expo start
```

Open in Expo Go on your phone, or press `i` / `a` for the iOS/Android simulator.

## Project structure

```
app/
  (auth)/          login, register, forgot-password
  client/          client portal screens
  therapist/       therapist portal screens
  admin/           owner/admin portal screens
  _layout.tsx      wraps the app in AuthProvider
  index.tsx        redirects to the right portal based on role
src/
  lib/supabase.ts       Supabase client
  context/AuthContext   session + profile + sign in/up/out
  hooks/useAuth.ts
  services/             typed data-access functions per feature area
  components/ui.tsx     shared, brand-styled primitives
  constants/roles.ts
  types/database.types.ts
supabase/
  migrations/0001_v1_schema.sql   full V1 schema + RLS policies
```

## Security model

Every table has RLS enabled. In short:

- **Clients** see only their own records.
- **Therapists** see only clients assigned to them (`client_therapist_assignments`).
- **Owner/Admin** see everything within their own clinic (`clinic_id` match) — never
  another clinic's data.
- SOAP notes are only ever writable by the therapist who created them; signing is a
  separate, explicit action that also writes an `audit_logs` row.

## Before production

- The free Supabase tier is **not HIPAA-enabled**. Prototype and test freely, but move to
  HIPAA-appropriate infrastructure before storing real client health data.
- Have the business/legal side validate that the in-app consent flow (`app/client/consent.tsx`)
  satisfies electronic-signature requirements in your jurisdiction.
- Regenerate `src/types/database.types.ts` from the live schema once the project is linked:
  `npx supabase gen types typescript --linked > src/types/database.types.ts`

## What's next (V2 / V3)

Messaging, push notifications, per-therapist performance analytics and pain/mobility charts,
training assignments, referral tracking, and eventually multi-clinic organization switching
and AI-assisted (therapist-reviewed) SOAP drafting. See the roadmap presentation for the
full phased plan.
