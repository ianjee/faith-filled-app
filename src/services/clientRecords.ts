import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type ConsentInsert = Database["public"]["Tables"]["consents"]["Insert"];

/**
 * Creates a consent record.
 *
 * ConsentInsert is intentionally used instead of Partial<Consent> because
 * Supabase's generated Insert type correctly requires client_id,
 * document_name, and document_version.
 */
export async function createConsent(consent: ConsentInsert) {
  return supabase.from("consents").insert(consent).select().single();
}
