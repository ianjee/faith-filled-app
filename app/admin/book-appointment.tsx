import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { createAppointment } from "@/services/appointments";
import {
  Heading,
  Eyebrow,
  Card,
  PrimaryButton,
  SecondaryButton,
  COLORS,
} from "@/components/ui";

interface Client {
  id: string;
  full_name: string | null;
  phone: string | null;
}

interface Therapist {
  id: string;
  full_name: string | null;
}

const SERVICES = [
  "Integrative Restorative Bodywork",
  "Aroma Acupoint Therapy",
  "Tuning Fork Therapy",
  "Ion Cleanse Foot Bath",
  "Red Light Therapy",
  "HUSO Sound Therapy",
  "Signature Healing Reset",
];

function getClinicId(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toISO(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function getTimeSlots() {
  const slots: string[] = [];

  for (let hour = 8; hour <= 20; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 20 && minute === 30) continue;

      slots.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      );
    }
  }

  return slots;
}

export default function AdminBookAppointment() {
  const { profile } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState("");
  const [therapistId, setTherapistId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [date, setDate] = useState(getDateKey(new Date()));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [showClients, setShowClients] = useState(false);
  const [showTherapists, setShowTherapists] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showStartTimes, setShowStartTimes] = useState(false);
  const [showEndTimes, setShowEndTimes] = useState(false);

  const timeSlots = useMemo(() => getTimeSlots(), []);

  const selectedClient = clients.find((client) => client.id === clientId);
  const selectedTherapist = therapists.find(
    (therapist) => therapist.id === therapistId
  );

  const dates = useMemo(() => {
    const result: Date[] = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      result.push(date);
    }

    return result;
  }, []);

  useEffect(() => {
    const clinicIdValue = getClinicId(profile?.clinic_id);

    if (!clinicIdValue) {
      setClients([]);
      setTherapists([]);
      setLoading(false);
      return;
    }

    // Explicitly narrowed to string.
    const clinicId: string = clinicIdValue;

    async function loadData() {
      setLoading(true);

      const [clientResult, therapistResult] = await Promise.all([
        supabase
          .from("clients")
          .select("id, profiles!inner(full_name, phone)")
          .eq("clinic_id", clinicId)
          .eq("profiles.role", "client")
          .order("created_at", { ascending: false }),

        supabase
          .from("therapists")
          .select("id, profiles!inner(full_name)")
          .eq("clinic_id", clinicId)
          .eq("profiles.role", "therapist")
          .order("created_at", { ascending: false }),
      ]);

      if (clientResult.error) {
        console.warn(
          "Failed to load clients:",
          clientResult.error.message
        );
      }

      if (therapistResult.error) {
        console.warn(
          "Failed to load therapists:",
          therapistResult.error.message
        );
      }

      setClients(
        (clientResult.data ?? []).map((item: any) => ({
          id: item.id,
          full_name: item.profiles?.full_name ?? "Client",
          phone: item.profiles?.phone ?? null,
        }))
      );

      setTherapists(
        (therapistResult.data ?? []).map((item: any) => ({
          id: item.id,
          full_name: item.profiles?.full_name ?? "Therapist",
        }))
      );

      setLoading(false);
    }

    loadData();
  }, [profile?.clinic_id]);

  function selectDate(value: string) {
    setDate(value);
    setStartTime("");
    setEndTime("");
  }

  function selectStartTime(value: string) {
    setStartTime(value);
    setEndTime("");
    setShowStartTimes(false);
  }

  function selectEndTime(value: string) {
    setEndTime(value);
    setShowEndTimes(false);
  }

  async function handleCreate() {
    const clinicIdValue = getClinicId(profile?.clinic_id);

    if (!clinicIdValue) {
      Alert.alert(
        "Missing clinic",
        "Your account is not assigned to a clinic."
      );
      return;
    }

    const clinicId: string = clinicIdValue;

    if (
      !clientId ||
      !therapistId ||
      !serviceName ||
      !date ||
      !startTime ||
      !endTime
    ) {
      Alert.alert(
        "Incomplete appointment",
        "Please complete all appointment details."
      );
      return;
    }

    if (endTime <= startTime) {
      Alert.alert(
        "Invalid time",
        "The end time must be later than the start time."
      );
      return;
    }

    setSaving(true);

    try {
      const startsAt = toISO(date, startTime);
      const endsAt = toISO(date, endTime);

      const { data: conflicts, error: conflictError } = await supabase
        .from("appointments")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("therapist_id", therapistId)
        .eq("status", "scheduled")
        .lt("starts_at", endsAt)
        .gt("ends_at", startsAt);

      if (conflictError) {
        throw conflictError;
      }

      if (conflicts?.length) {
        Alert.alert(
          "Time unavailable",
          "This therapist already has an appointment during this time."
        );
        return;
      }

      const { error } = await createAppointment({
        clinic_id: clinicId,
        client_id: clientId,
        therapist_id: therapistId,
        service_name: serviceName,
        starts_at: startsAt,
        ends_at: endsAt,
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        "Appointment booked",
        "The appointment was created successfully.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/admin/appointments"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Booking failed",
        error?.message ?? "Unable to create the appointment."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!getClinicId(profile?.clinic_id)) {
    return (
      <ScrollView
        style={{ backgroundColor: COLORS.cream }}
        contentContainerStyle={{
          padding: 22,
          paddingTop: 50,
          paddingBottom: 34,
        }}
      >
        <Eyebrow>Clinic workspace</Eyebrow>
        <Heading>Book Appointment</Heading>

        <Card>
          <Text style={{ color: COLORS.inkMid }}>
            Your account is not assigned to a clinic.
          </Text>
        </Card>

        <SecondaryButton title="Back" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <ScrollView
        style={{ backgroundColor: COLORS.cream }}
        contentContainerStyle={{
          padding: 22,
          paddingTop: 50,
          paddingBottom: 34,
        }}
      >
        <Eyebrow>Clinic workspace</Eyebrow>
        <Heading>Book Appointment</Heading>

        {[1, 2, 3, 4].map((item) => (
          <Card key={item}>
            <View
              style={{
                width: item === 1 ? "45%" : "70%",
                height: item === 1 ? 9 : 16,
                borderRadius: 5,
                backgroundColor: COLORS.border,
                marginBottom: 8,
              }}
            />

            {item !== 1 && (
              <View
                style={{
                  width: "35%",
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: COLORS.border,
                }}
              />
            )}
          </Card>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: COLORS.cream }}
      contentContainerStyle={{
        padding: 22,
        paddingTop: 50,
        paddingBottom: 34,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Eyebrow>Clinic workspace</Eyebrow>
      <Heading>Book Appointment</Heading>

      <Card>
        <Text style={styles.label}>CLIENT</Text>

        <Pressable
          onPress={() => setShowClients((value) => !value)}
          style={styles.selector}
        >
          <Text style={clientId ? styles.selectedText : styles.placeholder}>
            {selectedClient?.full_name ?? "Select a client"}
          </Text>

          <Text style={styles.arrow}>
            {showClients ? "⌃" : "⌄"}
          </Text>
        </Pressable>

        {showClients && (
          <View style={styles.options}>
            {clients.length ? (
              clients.map((client) => (
                <Pressable
                  key={client.id}
                  onPress={() => {
                    setClientId(client.id);
                    setShowClients(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.optionName}>
                    {client.full_name ?? "Client"}
                  </Text>

                  {client.phone ? (
                    <Text style={styles.optionSub}>{client.phone}</Text>
                  ) : null}
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No clients available.
              </Text>
            )}
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.label}>THERAPIST</Text>

        <Pressable
          onPress={() => setShowTherapists((value) => !value)}
          style={styles.selector}
        >
          <Text
            style={
              therapistId ? styles.selectedText : styles.placeholder
            }
          >
            {selectedTherapist?.full_name ?? "Select a therapist"}
          </Text>

          <Text style={styles.arrow}>
            {showTherapists ? "⌃" : "⌄"}
          </Text>
        </Pressable>

        {showTherapists && (
          <View style={styles.options}>
            {therapists.length ? (
              therapists.map((therapist) => (
                <Pressable
                  key={therapist.id}
                  onPress={() => {
                    setTherapistId(therapist.id);
                    setShowTherapists(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.optionName}>
                    {therapist.full_name ?? "Therapist"}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No therapists available.
              </Text>
            )}
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.label}>SERVICE</Text>

        <Pressable
          onPress={() => setShowServices((value) => !value)}
          style={styles.selector}
        >
          <Text
            style={
              serviceName ? styles.selectedText : styles.placeholder
            }
          >
            {serviceName || "Select a service"}
          </Text>

          <Text style={styles.arrow}>
            {showServices ? "⌃" : "⌄"}
          </Text>
        </Pressable>

        {showServices && (
          <View style={styles.options}>
            {SERVICES.map((service) => (
              <Pressable
                key={service}
                onPress={() => {
                  setServiceName(service);
                  setShowServices(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.optionName}>{service}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.label}>DATE</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {dates.map((item) => {
            const value = getDateKey(item);
            const selected = value === date;

            return (
              <Pressable
                key={value}
                onPress={() => selectDate(value)}
                style={[
                  styles.dateOption,
                  selected && styles.selectedOption,
                ]}
              >
                <Text
                  style={[
                    styles.dateDay,
                    selected && styles.selectedOptionText,
                  ]}
                >
                  {item.toLocaleDateString([], {
                    weekday: "short",
                  })}
                </Text>

                <Text
                  style={[
                    styles.dateNumber,
                    selected && styles.selectedOptionText,
                  ]}
                >
                  {item.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.dateText}>
          {formatDate(new Date(`${date}T00:00:00`))}
        </Text>
      </Card>

      <Card>
        <Text style={styles.label}>START TIME</Text>

        <Pressable
          onPress={() => setShowStartTimes((value) => !value)}
          style={styles.selector}
        >
          <Text
            style={startTime ? styles.selectedText : styles.placeholder}
          >
            {startTime
              ? formatTime(startTime)
              : "Select start time"}
          </Text>

          <Text style={styles.arrow}>
            {showStartTimes ? "⌃" : "⌄"}
          </Text>
        </Pressable>

        {showStartTimes && (
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => (
              <Pressable
                key={time}
                onPress={() => selectStartTime(time)}
                style={[
                  styles.timeOption,
                  startTime === time && styles.selectedOption,
                ]}
              >
                <Text
                  style={[
                    styles.timeText,
                    startTime === time &&
                      styles.selectedOptionText,
                  ]}
                >
                  {formatTime(time)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.label}>END TIME</Text>

        <Pressable
          disabled={!startTime}
          onPress={() => setShowEndTimes((value) => !value)}
          style={[
            styles.selector,
            !startTime && styles.disabledSelector,
          ]}
        >
          <Text
            style={endTime ? styles.selectedText : styles.placeholder}
          >
            {endTime
              ? formatTime(endTime)
              : startTime
                ? "Select end time"
                : "Select start time first"}
          </Text>

          <Text style={styles.arrow}>
            {showEndTimes ? "⌃" : "⌄"}
          </Text>
        </Pressable>

        {showEndTimes && startTime && (
          <View style={styles.timeGrid}>
            {timeSlots
              .filter((time) => time > startTime)
              .map((time) => (
                <Pressable
                  key={time}
                  onPress={() => selectEndTime(time)}
                  style={[
                    styles.timeOption,
                    endTime === time && styles.selectedOption,
                  ]}
                >
                  <Text
                    style={[
                      styles.timeText,
                      endTime === time &&
                        styles.selectedOptionText,
                    ]}
                  >
                    {formatTime(time)}
                  </Text>
                </Pressable>
              ))}
          </View>
        )}
      </Card>

      {clientId &&
        therapistId &&
        serviceName &&
        startTime &&
        endTime && (
          <Card>
            <Text style={styles.label}>
              APPOINTMENT SUMMARY
            </Text>

            <SummaryRow
              label="Client"
              value={selectedClient?.full_name ?? "Client"}
            />

            <SummaryRow
              label="Therapist"
              value={
                selectedTherapist?.full_name ?? "Therapist"
              }
            />

            <SummaryRow
              label="Service"
              value={serviceName}
            />

            <SummaryRow
              label="Date"
              value={formatDate(
                new Date(`${date}T00:00:00`)
              )}
            />

            <SummaryRow
              label="Time"
              value={`${formatTime(startTime)} – ${formatTime(
                endTime
              )}`}
            />
          </Card>
        )}

      <PrimaryButton
        title={saving ? "Booking..." : "Confirm Appointment"}
        onPress={handleCreate}
        disabled={saving}
      />

      <View style={{ height: 10 }} />

      <SecondaryButton
        title="Back"
        onPress={() => router.back()}
      />
    </ScrollView>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = {
  label: {
    color: COLORS.inkMid,
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
    marginBottom: 9,
  },

  selector: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },

  disabledSelector: {
    opacity: 0.55,
  },

  selectedText: {
    flex: 1,
    color: COLORS.ink,
    fontSize: 14,
  },

  placeholder: {
    flex: 1,
    color: COLORS.inkMid,
    fontSize: 14,
  },

  arrow: {
    color: COLORS.inkMid,
    fontSize: 18,
    marginLeft: 8,
  },

  options: {
    marginTop: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    overflow: "hidden" as const,
  },

  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  optionName: {
    color: COLORS.ink,
    fontFamily: "Georgia",
    fontSize: 15,
  },

  optionSub: {
    color: COLORS.inkMid,
    fontSize: 11,
    marginTop: 3,
  },

  emptyText: {
    color: COLORS.inkMid,
    fontSize: 13,
    padding: 14,
  },

  pressed: {
    opacity: 0.65,
  },

  dateOption: {
    width: 62,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    alignItems: "center" as const,
    backgroundColor: COLORS.white,
  },

  selectedOption: {
    backgroundColor: COLORS.sageDeep,
    borderColor: COLORS.sageDeep,
  },

  dateDay: {
    color: COLORS.inkMid,
    fontSize: 10,
    marginBottom: 3,
  },

  dateNumber: {
    color: COLORS.ink,
    fontFamily: "Georgia",
    fontSize: 18,
  },

  selectedOptionText: {
    color: COLORS.white,
  },

  dateText: {
    color: COLORS.inkMid,
    fontSize: 12,
    marginTop: 10,
  },

  timeGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 7,
    marginTop: 8,
  },

  timeOption: {
    width: "31%",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    alignItems: "center" as const,
    backgroundColor: COLORS.white,
  },

  timeText: {
    color: COLORS.ink,
    fontSize: 12,
  },

  summaryRow: {
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  summaryLabel: {
    color: COLORS.inkMid,
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.6,
    marginBottom: 2,
  },

  summaryValue: {
    color: COLORS.ink,
    fontSize: 14,
  },
};