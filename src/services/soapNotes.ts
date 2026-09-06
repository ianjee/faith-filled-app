import { supabase } from "@/lib/supabase";
import type { SoapNote } from "@/types/database.types";

export type SoapNoteDraft = Omit<SoapNote, "id" | "created_at" | "signed_at">;

export async function getSoapNoteForAppointment(appointmentId: string) {
  return supabase
    .from("soap_notes")
    .select("*")
    .eq("appointment_id", appointmentId)
    .maybeSingle();
}

export async function saveSoapNoteDraft(draft: SoapNoteDraft, existingId?: string) {
  if (existingId) {
    return supabase.from("soap_notes").update(draft).eq("id", existingId).select().single();
  }
  return supabase.from("soap_notes").insert(draft).select().single();
}

/**
 * Signing is a distinct, explicit action — this is what makes the note final.
 * Pairs with an audit_logs entry so there is a record of who signed and when.
 */
export async function signSoapNote(soapNoteId: string, therapistId: string) {
  const { data, error } = await supabase
    .from("soap_notes")
    .update({ signed_at: new Date().toISOString() })
    .eq("id", soapNoteId)
    .select()
    .single();

  if (!error) {
    await supabase.from("audit_logs").insert({
      actor_id: therapistId,
      event: "soap_note_signed",
      entity_type: "soap_notes",
      entity_id: soapNoteId,
    });
  }
  return { data, error };
}
