import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Screen, Eyebrow, Heading, Card, SecondaryButton, COLORS } from "@/components/ui";

interface ClientRow {
  id: string;
  full_name: string | null;
}

export default function AdminClients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<ClientRow[]>([]);

  useEffect(() => {
    if (!profile?.clinic_id) return;
    // Two-step lookup avoids depending on exact FK constraint names for embeds:
    // 1) clients scoped to this clinic (RLS "clients_admin"), 2) their profiles.
    (async () => {
      const clinicId = profile.clinic_id;
      if (!clinicId) return;
      const { data: clientRows } = await supabase.from("clients").select("id").eq("clinic_id", clinicId);
      const ids = (clientRows ?? []).map((r: { id: string }) => r.id);
      if (ids.length === 0) {
        setClients([]);
        return;
      }
      const { data: profileRows } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setClients((profileRows ?? []).map((p: { id: string; full_name: string | null }) => ({ id: p.id, full_name: p.full_name })));
    })();
  }, [profile?.clinic_id]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
        <Eyebrow>Clinic workspace</Eyebrow>
        <Heading>Clients</Heading>

        {clients.length === 0 ? (
          <Card>
            <Text style={{ color: COLORS.inkMid }}>No clients on file yet.</Text>
          </Card>
        ) : (
          clients.map((c) => (
            <Card key={c.id}>
              <Text style={{ fontFamily: "Georgia", fontSize: 17, color: COLORS.ink }}>{c.full_name ?? "Client"}</Text>
            </Card>
          ))
        )}

        <View style={{ height: 4 }} />
        <SecondaryButton title="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
