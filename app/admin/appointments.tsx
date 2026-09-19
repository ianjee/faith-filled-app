import React, { useCallback, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View, StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getClinicAppointments, updateAppointmentStatus } from "@/services/appointments";
import { Card, Eyebrow, Heading, PrimaryButton, SecondaryButton, COLORS } from "@/components/ui";

interface Appointment {
  id: string;
  service_name: string;
  starts_at: string;
  ends_at: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  client_name: string;
  therapist_name: string;
}

function getClinicId(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function statusLabel(status: Appointment["status"]) {
  return status === "completed"
    ? "Completed"
    : status === "cancelled"
      ? "Cancelled"
      : status === "no_show"
        ? "No Show"
        : "Scheduled";
}

function StatusPill({ status }: { status: Appointment["status"] }) {
  return (
    <View style={[styles.statusPill, styles[`status_${status}`]]}>
      <Text style={styles.statusText}>{statusLabel(status)}</Text>
    </View>
  );
}

function ActionIcon({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed, disabled && styles.actionDisabled]}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
    </Pressable>
  );
}

function AppointmentSkeleton() {
  return (
    <Card>
      <View style={styles.skeletonTop}>
        <View style={styles.skeletonDate} />
        <View style={styles.skeletonStatus} />
      </View>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonText} />
      <View style={styles.skeletonTextSmall} />
    </Card>
  );
}

function AppointmentCard({
  appointment,
  updating,
  onCompleted,
  onNoShow,
  onCancel,
}: {
  appointment: Appointment;
  updating: boolean;
  onCompleted: () => void;
  onNoShow: () => void;
  onCancel: () => void;
}) {
  return (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{formatDate(appointment.starts_at)}</Text>
        <StatusPill status={appointment.status} />
      </View>

      <Text style={styles.serviceName}>{appointment.service_name}</Text>

      <View style={styles.details}>
        <Text style={styles.clientName}>{appointment.client_name}</Text>
        <Text style={styles.timeText}>
          {formatTime(appointment.starts_at)} – {formatTime(appointment.ends_at)}
        </Text>
        <Text style={styles.therapistText}>{appointment.therapist_name}</Text>
      </View>

      {appointment.status === "scheduled" && (
        <View style={styles.actionRow}>
          <ActionIcon
            icon="✓"
            label="Mark appointment as completed"
            onPress={onCompleted}
            disabled={updating}
          />
          <ActionIcon
            icon="—"
            label="Mark appointment as no-show"
            onPress={onNoShow}
            disabled={updating}
          />
          <ActionIcon
            icon="×"
            label="Cancel appointment"
            onPress={onCancel}
            disabled={updating}
          />
        </View>
      )}
    </Card>
  );
}

export default function AdminAppointments() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    const clinicId = getClinicId(profile?.clinic_id);

    if (!clinicId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await getClinicAppointments(clinicId);
      if (error) throw error;

      const rows = (data ?? []) as any[];

      setAppointments(
        rows.map((item) => ({
          id: item.id,
          service_name: item.service_name ?? "Appointment",
          starts_at: item.starts_at,
          ends_at: item.ends_at,
          status: item.status,
          client_name: item.clients?.profiles?.full_name ?? "Client",
          therapist_name: item.therapists?.profiles?.full_name ?? "Therapist",
        }))
      );
    } catch (error: any) {
      Alert.alert("Unable to load appointments", error?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [profile?.clinic_id]);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  async function refreshAppointments() {
    setRefreshing(true);
    try {
      await loadAppointments();
    } finally {
      setRefreshing(false);
    }
  }

  async function changeStatus(
    appointment: Appointment,
    status: "completed" | "no_show" | "cancelled"
  ) {
    const title =
      status === "completed"
        ? "Mark Completed"
        : status === "no_show"
          ? "Mark No-Show"
          : "Cancel Appointment";

    const message =
      status === "completed"
        ? "Mark this appointment as completed?"
        : status === "no_show"
          ? "Mark this appointment as a no-show?"
          : "Cancel this appointment?";

    Alert.alert(title, message, [
      { text: "Keep", style: "cancel" },
      {
        text: status === "cancelled" ? "Cancel Appointment" : "Confirm",
        style: status === "cancelled" ? "destructive" : "default",
        onPress: async () => {
          setUpdatingId(appointment.id);

          try {
            const { error } = await updateAppointmentStatus(appointment.id, status);
            if (error) throw error;

            setAppointments((current) =>
              current.map((item) =>
                item.id === appointment.id ? { ...item, status } : item
              )
            );
          } catch (error: any) {
            Alert.alert("Update failed", error?.message ?? "Unable to update the appointment.");
          } finally {
            setUpdatingId(null);
          }
        },
      },
    ]);
  }

  const scheduled = appointments.filter((item) => item.status === "scheduled");
  const history = appointments.filter((item) => item.status !== "scheduled");

  if (!getClinicId(profile?.clinic_id)) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <Eyebrow>Clinic workspace</Eyebrow>
        <Heading>Appointments</Heading>
        <Card>
          <Text style={styles.emptyText}>Your account is not assigned to a clinic.</Text>
        </Card>
        <SecondaryButton title="Back" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAppointments} />}
    >
      <Eyebrow>Clinic workspace</Eyebrow>
      <Heading>Appointments</Heading>

      <PrimaryButton title="Book Appointment" onPress={() => router.push("/admin/book-appointment")} />

      <View style={styles.sectionSpace} />

      {loading ? (
        <>
          <AppointmentSkeleton />
          <AppointmentSkeleton />
          <AppointmentSkeleton />
        </>
      ) : appointments.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>No appointments yet</Text>
          <Text style={styles.emptyText}>Book an appointment to see it here.</Text>
        </Card>
      ) : (
        <>
          {scheduled.length > 0 && (
            <>
              <Eyebrow>Upcoming</Eyebrow>
              {scheduled.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  updating={updatingId === appointment.id}
                  onCompleted={() => changeStatus(appointment, "completed")}
                  onNoShow={() => changeStatus(appointment, "no_show")}
                  onCancel={() => changeStatus(appointment, "cancelled")}
                />
              ))}
            </>
          )}

          {history.length > 0 && (
            <>
              <View style={styles.historyHeader}>
                <Eyebrow>History</Eyebrow>
              </View>

              {history.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  updating={updatingId === appointment.id}
                  onCompleted={() => changeStatus(appointment, "completed")}
                  onNoShow={() => changeStatus(appointment, "no_show")}
                  onCancel={() => changeStatus(appointment, "cancelled")}
                />
              ))}
            </>
          )}
        </>
      )}

      <View style={styles.bottomSpace} />
      <SecondaryButton title="Back" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.cream },
  container: { padding: 22, paddingTop: 50, paddingBottom: 34 },
  sectionSpace: { height: 18 },
  historyHeader: { marginTop: 12 },
  bottomSpace: { height: 8 },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  dateText: {
    color: COLORS.inkMid,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  serviceName: {
    color: COLORS.ink,
    fontFamily: "Georgia",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 7,
  },

  details: { gap: 3 },

  clientName: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "600",
  },

  timeText: { color: COLORS.inkMid, fontSize: 12 },
  therapistText: { color: COLORS.inkMid, fontSize: 11 },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },

  status_scheduled: { backgroundColor: COLORS.sage },
  status_completed: { backgroundColor: COLORS.sage },
  status_cancelled: { backgroundColor: COLORS.border },
  status_no_show: { backgroundColor: COLORS.border },

  statusText: {
    color: COLORS.ink,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 7,
    marginTop: 13,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  actionIcon: {
    color: COLORS.inkMid,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 18,
  },

  actionPressed: { opacity: 0.55, transform: [{ scale: 0.94 }] },
  actionDisabled: { opacity: 0.35 },

  emptyTitle: {
    color: COLORS.ink,
    fontFamily: "Georgia",
    fontSize: 17,
    marginBottom: 5,
  },

  emptyText: {
    color: COLORS.inkMid,
    fontSize: 13,
    lineHeight: 19,
  },

  skeletonTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  skeletonDate: {
    width: "25%",
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },

  skeletonStatus: {
    width: "20%",
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },

  skeletonTitle: {
    width: "65%",
    height: 17,
    borderRadius: 5,
    backgroundColor: COLORS.border,
    marginBottom: 9,
  },

  skeletonText: {
    width: "45%",
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
    marginBottom: 6,
  },

  skeletonTextSmall: {
    width: "30%",
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },
});