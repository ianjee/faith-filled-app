import { supabase } from "@/lib/supabase";
import type { Consent, HealthHistory, Survey } from "@/types/database.types";

// ---- Intake ---------------------------------------------------------------
export async function submitIntakeForm(clientId: string, responses: Record<string, unknown>) {
  return supabase
    .from("intake_forms")
    .insert({ client_id: clientId, responses, submitted_at: new Date().toISOString() })
    .select()
    .single();
}

// ---- Health history ---------------------------------------------------------------
export async function upsertHealthHistory(
  clientId: string,
  fields: Pick<HealthHistory, "conditions" | "medications" | "notes">
) {
  return supabase
    .from("health_histories")
    .upsert({ client_id: clientId, ...fields, updated_at: new Date().toISOString() })
    .select()
    .single();
}

// ---- Consent ---------------------------------------------------------------
export async function signConsent(
  clientId: string,
  documentName: string,
  documentVersion: string
) {
  const consent: Partial<Consent> = {
    client_id: clientId,
    document_name: documentName,
    document_version: documentVersion,
    agreed: true,
    agreed_at: new Date().toISOString(),
  };
  return supabase.from("consents").insert(consent).select().single();
}

// ---- Home care ---------------------------------------------------------------
export async function getHomeCareForClient(clientId: string) {
  return supabase
    .from("home_care_recommendations")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
}

// ---- Outcome-based post-session survey ---------------------------------------------------------------
export async function submitSurvey(
  survey: Omit<Survey, "id" | "created_at">
) {
  return supabase.from("surveys").insert(survey).select().single();
}
