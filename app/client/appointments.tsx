import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Screen, Eyebrow, Heading, Card, PrimaryButton, SecondaryButton, Pill, COLORS } from "@/components/ui";

interface Appointment {
  id: string;
  clinic_id: string;
  client_id: string;
  therapist_id: string;
  service_name: string;
  starts_at: string;
  ends_at: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  created_at: string;
}

export default function Appointments() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!profile) return;
    // Table: appointments — RLS "appointments_client" scopes to client_id = auth.uid()
    supabase
      .from("appointments")
      .select("*")
      .eq("client_id", profile.id)
      .order("starts_at", { ascending: false })
      .then(({ data }) => setAppointments((data as Appointment[]) ?? []));
  }, [profile?.id]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
        <Eyebrow>Your sessions</Eyebrow>
        <Heading>Appointment History</Heading>

        {appointments.length === 0 ? (
          <Card>
            <Text style={{ color: COLORS.inkMid }}>No appointments yet.</Text>
          </Card>
        ) : (
          appointments.map((item) => (
            <Card key={item.id}>
              <Text style={{ fontFamily: "Georgia", fontSize: 17, color: COLORS.ink, marginBottom: 4 }}>
                {item.service_name}
              </Text>
              <Text style={{ color: COLORS.inkMid, marginBottom: 6 }}>
                {new Date(item.starts_at).toLocaleString([], {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Pill text={item.status} />
              {item.status === "completed" ? (
                <View style={{ marginTop: 10 }}>
                  <PrimaryButton
                    title="Leave Feedback"
                    onPress={() => router.push({ pathname: "/client/survey", params: { appointmentId: item.id } })}
                  />
                </View>
              ) : null}
            </Card>
          ))
        )}

        <View style={{ height: 4 }} />
        <SecondaryButton title="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
