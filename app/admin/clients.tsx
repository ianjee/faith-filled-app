import React, { useEffect, useState } from "react";
import { ScrollView, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  Screen,
  Eyebrow,
  Heading,
  Card,
  SecondaryButton,
  COLORS,
} from "@/components/ui";

interface ClientRow {
  id: string;
  full_name: string | null;
}

export default function AdminClients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.clinic_id) {
      setClients([]);
      setLoading(false);
      return;
    }

    const clinicId = profile.clinic_id;

    async function loadClients() {
      setLoading(true);

      const { data: clientRows, error } = await supabase
        .from("clients")
        .select("id")
        .eq("clinic_id", clinicId);

      if (error) {
        console.warn("Failed to load clients:", error.message);
        setClients([]);
        setLoading(false);
        return;
      }

      const ids = (clientRows ?? []).map((r: { id: string }) => r.id);

      if (ids.length === 0) {
        setClients([]);
        setLoading(false);
        return;
      }

      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);

      if (profileError) {
        console.warn("Failed to load client profiles:", profileError.message);
        setClients([]);
        setLoading(false);
        return;
      }

      setClients(
        (profileRows ?? []).map(
          (p: { id: string; full_name: string | null }) => ({
            id: p.id,
            full_name: p.full_name,
          })
        )
      );

      setLoading(false);
    }

    loadClients();
  }, [profile?.clinic_id]);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Eyebrow>Clinic workspace</Eyebrow>
        <Heading>Clients</Heading>

        {loading ? (
          <Card>
            <Text style={styles.muted}>Loading clients...</Text>
          </Card>
        ) : clients.length === 0 ? (
          <Card>
            <Text style={styles.muted}>No clients on file yet.</Text>
          </Card>
        ) : (
          clients.map((client) => (
            <Pressable
              key={client.id}
              onPress={() =>
                router.push({
                  pathname: "/admin/client-details",
                  params: { clientId: client.id },
                })
              }
              style={({ pressed }) => [
                styles.clientCard,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.clientName}>
                {client.full_name ?? "Client"}
              </Text>

              <Text style={styles.viewText}>View client records →</Text>
            </Pressable>
          ))
        )}

        <SecondaryButton title="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 34,
  },
  clientCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 14,
  },
  clientName: {
    fontFamily: "Georgia",
    fontSize: 18,
    color: COLORS.ink,
    marginBottom: 6,
  },
  viewText: {
    fontSize: 13,
    color: COLORS.sageDeep,
    fontWeight: "600",
  },
  muted: {
    color: COLORS.inkMid,
  },
  pressed: {
    opacity: 0.75,
  },
});