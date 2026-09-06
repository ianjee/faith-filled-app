import React, { useEffect, useState } from "react";
import { FlatList, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getAssignedClients } from "@/services/clients";
import { Heading, Card, COLORS } from "@/components/ui";

interface AssignedClientRow {
  client_id: string;
  clients: { id: string; profiles: { full_name: string | null; phone: string | null } | null } | null;
}

export default function TherapistClients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<AssignedClientRow[]>([]);

  useEffect(() => {
    if (!profile) return;
    getAssignedClients(profile.id).then(({ data }) => {
      setClients((data as unknown as AssignedClientRow[]) ?? []);
    });
  }, [profile]);

  return (
    <FlatList
      style={{ backgroundColor: COLORS.cream }}
      contentContainerStyle={{ padding: 20, flexGrow: 1 }}
      ListHeaderComponent={<Heading>Your clients</Heading>}
      data={clients}
      keyExtractor={(item) => item.client_id}
      ListEmptyComponent={<Text style={{ color: COLORS.inkMid }}>No clients assigned yet.</Text>}
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            router.push({ pathname: "/therapist/client-profile", params: { clientId: item.client_id } })
          }
        >
          <Card>
            <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.ink }}>
              {item.clients?.profiles?.full_name ?? "Client"}
            </Text>
            {item.clients?.profiles?.phone && (
              <Text style={{ color: COLORS.inkMid }}>{item.clients.profiles.phone}</Text>
            )}
          </Card>
        </Pressable>
      )}
    />
  );
}
