import React, { useEffect, useState } from "react";
import { FlatList, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getTodaysAppointmentsForTherapist } from "@/services/appointments";
import { Heading, Card, Eyebrow, PrimaryButton, SecondaryButton, COLORS } from "@/components/ui";
import type { Appointment } from "@/types/database.types";

type AppointmentWithClient = Appointment & {
  clients?: { profiles?: { full_name: string | null } | null } | null;
};

export default function TherapistDashboard() {
  const { profile, signOut } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);

  useEffect(() => {
    if (!profile) return;
    getTodaysAppointmentsForTherapist(profile.id).then(({ data }) => {
      setAppointments((data as unknown as AppointmentWithClient[]) ?? []);
    });
  }, [profile]);

  return (
    <FlatList
      style={{ backgroundColor: COLORS.cream }}
      contentContainerStyle={{ padding: 22, paddingTop: 30, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          <Eyebrow>Therapist workspace</Eyebrow>
          <Heading>Good day, {profile?.full_name?.split(" ")[0] ?? "there"}</Heading>
          <Text style={{ color: COLORS.inkMid, fontSize: 15, marginBottom: 22 }}>Here is your schedule for today.</Text>
          <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: 20 }} />
          <Eyebrow>Today's sessions</Eyebrow>
        </View>
      }
      data={appointments}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <Card><Text style={{ color: COLORS.inkMid }}>No sessions scheduled today.</Text></Card>
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push({ pathname: "/therapist/soap-note", params: { appointmentId: item.id } })}>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 66 }}>
                <Text style={{ fontFamily: "Georgia", fontSize: 18, color: COLORS.sageDeep }}>
                  {new Date(item.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
              <View style={{ width: 1, height: 42, backgroundColor: COLORS.border, marginRight: 15 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Georgia", fontSize: 17, color: COLORS.ink, marginBottom: 4 }}>
                  {item.clients?.profiles?.full_name ?? "Client"}
                </Text>
                <Text style={{ color: COLORS.inkMid, fontSize: 12 }}>{item.service_name}</Text>
              </View>
              <Text style={{ color: COLORS.gold, fontSize: 23 }}>›</Text>
            </View>
          </Card>
        </Pressable>
      )}
      ListFooterComponent={
        <View style={{ marginTop: 8 }}>
          <PrimaryButton title="View all clients" onPress={() => router.push("/therapist/clients")} />
          <View style={{ height: 10 }} />
          <SecondaryButton title="Sign out" onPress={signOut} />
        </View>
      }
    />
  );
}
