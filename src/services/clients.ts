import { supabase } from "@/lib/supabase";

/** Clients assigned to a specific therapist (RLS also enforces this server-side). */
export async function getAssignedClients(therapistId: string) {
  return supabase
    .from("client_therapist_assignments")
    .select("client_id, clients(id, profiles(full_name, phone))")
    .eq("therapist_id", therapistId);
}

/** All clients in a clinic — owner/admin only (enforced by RLS). */
export async function getClinicClients(clinicId: string) {
  return supabase
    .from("clients")
    .select("*, profiles(full_name, phone)")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });
}

export async function getClientProfile(clientId: string) {
  return supabase
    .from("clients")
    .select(
      "*, profiles(full_name, phone), health_histories(*), intake_forms(*), consents(*)"
    )
    .eq("id", clientId)
    .single();
}
