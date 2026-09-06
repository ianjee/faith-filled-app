import React, { useEffect, useState } from "react";
import { FlatList, Text } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { getClinicClients } from "@/services/clients";
import { Heading, Card, COLORS } from "@/components/ui";

interface ClinicClientRow {
  id: string;
  profiles: { full_name: string | null; phone: string | null } | null;
}

export default function AdminClients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<ClinicClientRow[]>([]);

  useEffect(() => {
    if (!profile?.clinic_id) return;
    getClinicClients(profile.clinic_id).then(({ data }) => {
      setClients((data as unknown as ClinicClientRow[]) ?? []);
    });
  }, [profile]);

  return (
    <FlatList
      style={{ backgroundColor: COLORS.cream }}
      contentContainerStyle={{ padding: 20, flexGrow: 1 }}
      ListHeaderComponent={<Heading>All clients</Heading>}
      data={clients}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={{ color: COLORS.inkMid }}>No clients yet.</Text>}
      renderItem={({ item }) => (
        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.ink }}>
            {item.profiles?.full_name ?? "Client"}
          </Text>
          {item.profiles?.phone && <Text style={{ color: COLORS.inkMid }}>{item.profiles.phone}</Text>}
        </Card>
      )}
    />
  );
}
