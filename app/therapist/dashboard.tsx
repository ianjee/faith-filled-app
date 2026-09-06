import React, { useEffect, useState } from "react";
import { FlatList, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getTodaysAppointmentsForTherapist } from "@/services/appointments";
import { Heading, Card, Label, PrimaryButton, COLORS } from "@/components/ui";
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
      contentContainerStyle={{ padding: 20, flexGrow: 1 }}
      ListHeaderComponent={
        <>
          <Heading>Good day, {profile?.full_name?.split(" ")[0] ?? "there"}</Heading>
          <Label>Today</Label>
        </>
      }
      data={appointments}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={{ color: COLORS.inkMid }}>No sessions scheduled today.</Text>}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push({ pathname: "/therapist/soap-note", params: { appointmentId: item.id } })}>
          <Card>
            <Text style={{ color: COLORS.sageDeep, fontWeight: "700" }}>
              {new Date(item.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.ink, marginTop: 2 }}>
              {item.clients?.profiles?.full_name ?? "Client"}
            </Text>
            <Text style={{ color: COLORS.inkMid }}>{item.service_name}</Text>
          </Card>
        </Pressable>
      )}
      ListFooterComponent={
        <View style={{ marginTop: 20 }}>
          <PrimaryButton title="View all clients" onPress={() => router.push("/therapist/clients")} />
          <View style={{ height: 10 }} />
          <PrimaryButton title="Sign out" onPress={signOut} />
        </View>
      }
    />
  );
}
