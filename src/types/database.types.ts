// Hand-written types matching supabase/migrations/0001_v1_schema.sql.
// Once the project is linked, replace this file by running:
//   npx supabase gen types typescript --linked > src/types/database.types.ts

export type UserRole = "owner" | "admin" | "therapist" | "client";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface Profile {
  id: string;
  clinic_id: string | null;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_path: string | null;
  created_at: string;
}

export interface Clinic {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  clinic_id: string;
  date_of_birth: string | null;
  emergency_contact: string | null;
  created_at: string;
}

export interface Therapist {
  id: string;
  clinic_id: string;
  specialties: string[] | null;
  bio: string | null;
  created_at: string;
}

export interface IntakeForm {
  id: string;
  client_id: string;
  responses: Record<string, unknown>;
  submitted_at: string | null;
  created_at: string;
}

export interface HealthHistory {
  id: string;
  client_id: string;
  conditions: string[] | null;
  medications: string[] | null;
  notes: string | null;
  updated_at: string;
}

export interface Consent {
  id: string;
  client_id: string;
  document_name: string;
  document_version: string;
  agreed: boolean;
  agreed_at: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  client_id: string;
  therapist_id: string;
  service_name: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  created_at: string;
}

export interface SoapNote {
  id: string;
  appointment_id: string;
  therapist_id: string;
  subjective: string | null;
  pain_before: number | null;
  objective: string | null;
  range_of_motion: string | null;
  assessment: string | null;
  plan_next_treatment: string | null;
  plan_home_care: string | null;
  signed_at: string | null;
  created_at: string;
}

export interface TreatmentGoal {
  id: string;
  client_id: string;
  soap_note_id: string | null;
  goal: string;
  target_date: string | null;
  achieved: boolean;
  created_at: string;
}

export interface HomeCareRecommendation {
  id: string;
  client_id: string;
  soap_note_id: string | null;
  instructions: string;
  created_at: string;
}

export interface Survey {
  id: string;
  appointment_id: string;
  client_id: string;
  pain_before: number | null;
  pain_after: number | null;
  sleep_improved: boolean | null;
  stress_improved: boolean | null;
  mobility_improved: boolean | null;
  communication_rating: number | null;
  understood_home_care: boolean | null;
  would_recommend: boolean | null;
  feedback_text: string | null;
  created_at: string;
}

export interface Photo {
  id: string;
  client_id: string;
  uploaded_by: string;
  session_id: string | null;
  storage_path: string;
  consent_id: string | null;
  created_at: string;
}

// Minimal Database generic shape so supabase-js typed queries compile.
// Expand table-by-table as screens need stronger typing, or replace with
// a generated file once `supabase gen types` has been run against the project.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      clinics: { Row: Clinic; Insert: Partial<Clinic>; Update: Partial<Clinic> };
      clients: { Row: Client; Insert: Partial<Client>; Update: Partial<Client> };
      therapists: { Row: Therapist; Insert: Partial<Therapist>; Update: Partial<Therapist> };
      intake_forms: { Row: IntakeForm; Insert: Partial<IntakeForm>; Update: Partial<IntakeForm> };
      health_histories: { Row: HealthHistory; Insert: Partial<HealthHistory>; Update: Partial<HealthHistory> };
      consents: { Row: Consent; Insert: Partial<Consent>; Update: Partial<Consent> };
      appointments: { Row: Appointment; Insert: Partial<Appointment>; Update: Partial<Appointment> };
      soap_notes: { Row: SoapNote; Insert: Partial<SoapNote>; Update: Partial<SoapNote> };
      treatment_goals: { Row: TreatmentGoal; Insert: Partial<TreatmentGoal>; Update: Partial<TreatmentGoal> };
      home_care_recommendations: { Row: HomeCareRecommendation; Insert: Partial<HomeCareRecommendation>; Update: Partial<HomeCareRecommendation> };
      surveys: { Row: Survey; Insert: Partial<Survey>; Update: Partial<Survey> };
      photos: { Row: Photo; Insert: Partial<Photo>; Update: Partial<Photo> };
    };
  };
}
