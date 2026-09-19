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
    .eq("status", "scheduled")
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

export async function getClinicAppointments(clinicId: string) {
  return supabase
    .from("appointments")
    .select(`
      *,
      clients(id, profiles(full_name)),
      therapists(id, profiles(full_name))
    `)
    .eq("clinic_id", clinicId)
    .order("starts_at", { ascending: true });
}

export async function createAppointment(
  appointment: Pick<
    Appointment,
    | "clinic_id"
    | "client_id"
    | "therapist_id"
    | "service_name"
    | "starts_at"
    | "ends_at"
  >
) {
  const { data: conflicts, error: conflictError } = await supabase
    .from("appointments")
    .select("id")
    .eq("therapist_id", appointment.therapist_id)
    .eq("status", "scheduled")
    .lt("starts_at", appointment.ends_at)
    .gt("ends_at", appointment.starts_at);

  if (conflictError) {
    return { data: null, error: conflictError };
  }

  if (conflicts?.length) {
    return {
      data: null,
      error: new Error(
        "This therapist already has an appointment during this time."
      ),
    };
  }

  return supabase
    .from("appointments")
    .insert({
      ...appointment,
      status: "scheduled",
    })
    .select()
    .single();
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "scheduled" | "completed" | "cancelled" | "no_show"
) {
  return supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .select()
    .single();
}

export async function markAppointmentComplete(appointmentId: string) {
  return updateAppointmentStatus(appointmentId, "completed");
}

export async function cancelAppointment(appointmentId: string) {
  return updateAppointmentStatus(appointmentId, "cancelled");
}

export async function markAppointmentNoShow(appointmentId: string) {
  return updateAppointmentStatus(appointmentId, "no_show");
}
