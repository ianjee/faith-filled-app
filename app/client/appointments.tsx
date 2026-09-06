import React, { useEffect, useState } from "react";
import { FlatList, Text } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { getAppointmentHistoryForClient } from "@/services/appointments";
import { Heading, Card, COLORS } from "@/components/ui";
import type { Appointment } from "@/types/database.types";

export default function AppointmentHistory() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    getAppointmentHistoryForClient(profile.id).then(({ data }) => {
      setAppointments((data as unknown as Appointment[]) ?? []);
      setLoading(false);
    });
  }, [profile]);

  return (
    <FlatList
      style={{ backgroundColor: COLORS.cream }}
      contentContainerStyle={{ padding: 20, flexGrow: 1 }}
      ListHeaderComponent={<Heading>Appointment history</Heading>}
      data={appointments}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        !loading ? <Text style={{ color: COLORS.inkMid }}>No past sessions yet.</Text> : null
      }
      renderItem={({ item }) => (
        <Card>
          <Text style={{ fontWeight: "600", color: COLORS.ink }}>{item.service_name}</Text>
          <Text style={{ color: COLORS.inkMid, marginTop: 4 }}>
            {new Date(item.starts_at).toLocaleDateString([], {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </Card>
      )}
    />
  );
}
