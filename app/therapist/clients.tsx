import React, { useEffect, useState } from "react";
import { FlatList, Text, Pressable, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getAssignedClients } from "@/services/clients";
import { Heading, Card, SecondaryButton, COLORS } from "@/components/ui";

interface AssignedClientRow {
  client_id: string;
  clients: {
    id: string;
    profiles: {
      full_name: string | null;
      phone: string | null;
    } | null;
  } | null;
}

export default function TherapistClients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<AssignedClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    getAssignedClients(profile.id).then(({ data }) => {
      setClients((data as unknown as AssignedClientRow[]) ?? []);
      setLoading(false);
    });
  }, [profile]);

  return (
    <FlatList
      style={{ backgroundColor: COLORS.cream }}
      contentContainerStyle={{ padding: 20, paddingTop: 40, paddingBottom: 34, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={<Heading>Your clients</Heading>}
      data={loading ? [] : clients}
      keyExtractor={(item) => item.client_id}
      ListEmptyComponent={
        loading ? (
          <View>
            {[1, 2, 3].map((item) => (
              <Card key={item}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, gap: 7 }}>
                    <View style={{ width: 45, height: 8, borderRadius: 4, backgroundColor: COLORS.border }} />
                    <View style={{ width: "65%", height: 18, borderRadius: 5, backgroundColor: COLORS.border }} />
                    <View style={{ width: "35%", height: 10, borderRadius: 5, backgroundColor: COLORS.border }} />
                  </View>
                  <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.border }} />
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Text style={{ color: COLORS.inkMid }}>No clients assigned yet.</Text>
        )
      }
      renderItem={({ item }) => {
        const name = item.clients?.profiles?.full_name ?? "Client";
        const phone = item.clients?.profiles?.phone;

        return (
          <Pressable
            onPress={() => router.push({ pathname: "/therapist/client-profile", params: { clientId: item.client_id } })}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
          >
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ color: COLORS.inkMid, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 3 }}>
                    CLIENT
                  </Text>
                  <Text style={{ fontFamily: "Georgia", fontSize: 19, fontWeight: "700", letterSpacing: 0.5, color: COLORS.ink, marginBottom: 6 }}>
                    {name.toUpperCase()}
                  </Text>
                  {phone ? <Text style={{ color: COLORS.inkMid, fontSize: 12 }}>{phone}</Text> : null}
                </View>

                <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white }}>
                  <View style={{ width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.inkMid, marginBottom: 2 }} />
                    <View style={{ width: 14, height: 7, borderTopLeftRadius: 7, borderTopRightRadius: 7, backgroundColor: COLORS.inkMid }} />
                  </View>
                </View>
              </View>
            </Card>
          </Pressable>
        );
      }}
      ListFooterComponent={
        loading ? null : (
          <View style={{ marginTop: 8 }}>
            <SecondaryButton title="Back" onPress={() => router.back()} />
          </View>
        )
      }
    />
  );
}
