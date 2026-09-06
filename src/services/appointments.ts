import { supabase } from "@/lib/supabase";
import type { Appointment } from "@/types/database.types";

export async function getTodaysAppointmentsForTherapist(therapistId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return supabase
    .from("appointments")
    .select("*, clients(id, profiles(full_name))")
    .eq("therapist_id", therapistId)
    .gte("starts_at", startOfDay.toISOString())
    .lte("starts_at", endOfDay.toISOString())
    .order("starts_at", { ascending: true });
}

export async function getUpcomingAppointmentsForClient(clientId: string) {
  return supabase
    .from("appointments")
    .select("*, therapists(id, profiles(full_name))")
    .eq("client_id", clientId)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
}

export async function getAppointmentHistoryForClient(clientId: string) {
  return supabase
    .from("appointments")
    .select("*, therapists(id, profiles(full_name)), soap_notes(id, signed_at)")
    .eq("client_id", clientId)
    .lt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: false });
}

export async function createAppointment(
  appointment: Pick<
    Appointment,
    "clinic_id" | "client_id" | "therapist_id" | "service_name" | "starts_at" | "ends_at"
  >
) {
  return supabase.from("appointments").insert(appointment).select().single();
}

export async function markAppointmentComplete(appointmentId: string) {
  return supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", appointmentId);
}
