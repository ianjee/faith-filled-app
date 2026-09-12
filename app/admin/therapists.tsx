import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Screen, Eyebrow, Heading, Card, SecondaryButton, COLORS } from "@/components/ui";

interface TherapistRow {
  id: string;
  full_name: string | null;
  specialties: string[] | null;
}

export default function AdminTherapists() {
  const { profile } = useAuth();
  const [therapists, setTherapists] = useState<TherapistRow[]>([]);

  useEffect(() => {
    if (!profile?.clinic_id) return;
    const clinicId = profile.clinic_id;
    // Two-step lookup avoids depending on exact FK constraint names for embeds:
    // 1) therapists scoped to this clinic (RLS "therapists_admin"), 2) their profiles.
    (async () => {
      const { data: therapistRows } = await supabase
        .from("therapists")
        .select("id, specialties")
        .eq("clinic_id", clinicId);
      const ids = (therapistRows ?? []).map((r) => r.id);
      if (ids.length === 0) {
        setTherapists([]);
        return;
      }
      const { data: profileRows } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const nameById = new Map((profileRows ?? []).map((p) => [p.id, p.full_name]));
      setTherapists(
        (therapistRows ?? []).map((t) => ({
          id: t.id,
          full_name: nameById.get(t.id) ?? "Therapist",
          specialties: t.specialties,
        }))
      );
    })();
  }, [profile?.clinic_id]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
        <Eyebrow>Clinic workspace</Eyebrow>
        <Heading>Therapists</Heading>

        {therapists.length === 0 ? (
          <Card>
            <Text style={{ color: COLORS.inkMid }}>No therapists on file yet.</Text>
          </Card>
        ) : (
          therapists.map((t) => (
            <Card key={t.id}>
              <Text style={{ fontFamily: "Georgia", fontSize: 17, color: COLORS.ink, marginBottom: 4 }}>
                {t.full_name}
              </Text>
              {t.specialties?.length ? (
                <Text style={{ color: COLORS.inkMid, fontSize: 12 }}>{t.specialties.join(" · ")}</Text>
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
