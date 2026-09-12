// Hand-maintained to match supabase/migrations/0001_v1_schema.sql exactly.
// Prefer regenerating this file with the Supabase CLI once it's set up:
//   npx supabase gen types typescript --linked > src/types/database.types.ts
// That guarantees zero drift from the real schema. Until then, keep this file
// in sync by hand whenever a migration changes a table.
//
// IMPORTANT: every table needs a `Relationships` field (an array — empty is
// fine if you don't need embedded joins) because supabase-js's internal
// GenericTable type requires it. Omitting it makes every query on that table
// silently resolve to `never`, which is what caused the wall of TS errors.

export type UserRole = "owner" | "admin" | "therapist" | "client";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: { id?: string; name?: string; created_at?: string };
        Relationships: [];
      };
      clinics: {
        Row: { id: string; organization_id: string; name: string; address: string | null; created_at: string };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          clinic_id: string | null;
          role: UserRole;
          full_name: string | null;
          phone: string | null;
          avatar_path: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          clinic_id?: string | null;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          avatar_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string | null;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          avatar_path?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          clinic_id: string;
          date_of_birth: string | null;
          emergency_contact: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          clinic_id: string;
          date_of_birth?: string | null;
          emergency_contact?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          date_of_birth?: string | null;
          emergency_contact?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      therapists: {
        Row: {
          id: string;
          clinic_id: string;
          specialties: string[] | null;
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          clinic_id: string;
          specialties?: string[] | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          specialties?: string[] | null;
          bio?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      client_therapist_assignments: {
        Row: { client_id: string; therapist_id: string; assigned_at: string };
        Insert: { client_id: string; therapist_id: string; assigned_at?: string };
        Update: { client_id?: string; therapist_id?: string; assigned_at?: string };
        Relationships: [];
      };
      intake_forms: {
        Row: {
          id: string;
          client_id: string;
          responses: Record<string, unknown>;
          submitted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          responses?: Record<string, unknown>;
          submitted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          responses?: Record<string, unknown>;
          submitted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      health_histories: {
        Row: {
          id: string;
          client_id: string;
          conditions: string[] | null;
          medications: string[] | null;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          conditions?: string[] | null;
          medications?: string[] | null;
          notes?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          conditions?: string[] | null;
          medications?: string[] | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      consents: {
        Row: {
          id: string;
          client_id: string;
          document_name: string;
          document_version: string;
          agreed: boolean;
          agreed_at: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          document_name: string;
          document_version: string;
          agreed?: boolean;
          agreed_at?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          document_name?: string;
          document_version?: string;
          agreed?: boolean;
          agreed_at?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          clinic_id: string;
          client_id: string;
          therapist_id: string;
          service_name: string;
          starts_at: string;
          ends_at: string;
          status: AppointmentStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          client_id: string;
          therapist_id: string;
          service_name: string;
          starts_at: string;
          ends_at: string;
          status?: AppointmentStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          client_id?: string;
          therapist_id?: string;
          service_name?: string;
          starts_at?: string;
          ends_at?: string;
          status?: AppointmentStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      soap_notes: {
        Row: {
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
        };
        Insert: {
          id?: string;
          appointment_id: string;
          therapist_id: string;
          subjective?: string | null;
          pain_before?: number | null;
          objective?: string | null;
          range_of_motion?: string | null;
          assessment?: string | null;
          plan_next_treatment?: string | null;
          plan_home_care?: string | null;
          signed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          therapist_id?: string;
          subjective?: string | null;
          pain_before?: number | null;
          objective?: string | null;
          range_of_motion?: string | null;
          assessment?: string | null;
          plan_next_treatment?: string | null;
          plan_home_care?: string | null;
          signed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      treatment_goals: {
        Row: {
          id: string;
          client_id: string;
          soap_note_id: string | null;
          goal: string;
          target_date: string | null;
          achieved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          soap_note_id?: string | null;
          goal: string;
          target_date?: string | null;
          achieved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          soap_note_id?: string | null;
          goal?: string;
          target_date?: string | null;
          achieved?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      home_care_recommendations: {
        Row: {
          id: string;
          client_id: string;
          soap_note_id: string | null;
          instructions: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          soap_note_id?: string | null;
          instructions: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          soap_note_id?: string | null;
          instructions?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      surveys: {
        Row: {
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
        };
        Insert: {
          id?: string;
          appointment_id: string;
          client_id: string;
          pain_before?: number | null;
          pain_after?: number | null;
          sleep_improved?: boolean | null;
          stress_improved?: boolean | null;
          mobility_improved?: boolean | null;
          communication_rating?: number | null;
          understood_home_care?: boolean | null;
          would_recommend?: boolean | null;
          feedback_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          client_id?: string;
          pain_before?: number | null;
          pain_after?: number | null;
          sleep_improved?: boolean | null;
          stress_improved?: boolean | null;
          mobility_improved?: boolean | null;
          communication_rating?: number | null;
          understood_home_care?: boolean | null;
          would_recommend?: boolean | null;
          feedback_text?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          client_id: string;
          uploaded_by: string;
          session_id: string | null;
          storage_path: string;
          consent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          uploaded_by: string;
          session_id?: string | null;
          storage_path: string;
          consent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          uploaded_by?: string;
          session_id?: string | null;
          storage_path?: string;
          consent_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          event: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          event: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          event?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      appointment_status: AppointmentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row-level aliases used across the app's screens/services.
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Clinic = Database["public"]["Tables"]["clinics"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Therapist = Database["public"]["Tables"]["therapists"]["Row"];
export type IntakeForm = Database["public"]["Tables"]["intake_forms"]["Row"];
export type HealthHistory = Database["public"]["Tables"]["health_histories"]["Row"];
export type Consent = Database["public"]["Tables"]["consents"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type SoapNote = Database["public"]["Tables"]["soap_notes"]["Row"];
export type TreatmentGoal = Database["public"]["Tables"]["treatment_goals"]["Row"];
export type HomeCareRecommendation = Database["public"]["Tables"]["home_care_recommendations"]["Row"];
export type Survey = Database["public"]["Tables"]["surveys"]["Row"];
export type Photo = Database["public"]["Tables"]["photos"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];