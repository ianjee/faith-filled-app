import React, { useEffect, useState } from "react";
import { FlatList, Text } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Heading, Card, Pill, COLORS } from "@/components/ui";

interface TherapistRow {
  id: string;
  specialties: string[] | null;
  profiles: { full_name: string | null } | null;
}

export default function AdminTherapists() {
  const { profile } = useAuth();
  const [therapists, setTherapists] = useState<TherapistRow[]>([]);

  useEffect(() => {
    if (!profile?.clinic_id) return;
    supabase
      .from("therapists")
      .select("id, specialties, profiles(full_name)")
      .eq("clinic_id", profile.clinic_id)
      .then(({ data }) => setTherapists((data as unknown as TherapistRow[]) ?? []));
  }, [profile]);

  return (
    <FlatList
      style={{ backgroundColor: COLORS.cream }}
      contentContainerStyle={{ padding: 20, flexGrow: 1 }}
      ListHeaderComponent={<Heading>Therapists</Heading>}
      data={therapists}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={{ color: COLORS.inkMid }}>No therapists yet.</Text>}
      renderItem={({ item }) => (
        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.ink }}>
            {item.profiles?.full_name ?? "Therapist"}
          </Text>
          {item.specialties?.map((s) => <Pill key={s} text={s} />)}
        </Card>
      )}
    />
  );
}
