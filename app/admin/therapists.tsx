import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
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

interface TherapistRow {
  id: string;
  full_name: string | null;
  specialties: string[] | null;
}

export default function AdminTherapists() {
  const { profile } = useAuth();
  const [therapists, setTherapists] = useState<TherapistRow[]>([]);

  useEffect(() => {
    if (!profile?.clinic_id) {
      setTherapists([]);
      return;
    }

    const clinicId = profile.clinic_id;

    (async () => {
      const { data: therapistRows, error: therapistError } = await supabase
        .from("therapists")
        .select("id, specialties")
        .eq("clinic_id", clinicId);

      if (therapistError) {
        console.warn("Failed to load therapists:", therapistError.message);
        setTherapists([]);
        return;
      }

      const ids = (therapistRows ?? []).map((row) => row.id);

      if (ids.length === 0) {
        setTherapists([]);
        return;
      }

      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);

      if (profileError) {
        console.warn("Failed to load therapist profiles:", profileError.message);
      }

      const nameById = new Map(
        (profileRows ?? []).map((item) => [item.id, item.full_name])
      );

      setTherapists(
        (therapistRows ?? []).map((therapist) => ({
          id: therapist.id,
          full_name: nameById.get(therapist.id) ?? "Therapist",
          specialties: therapist.specialties,
        }))
      );
    })();
  }, [profile?.clinic_id]);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Eyebrow>Clinic workspace</Eyebrow>
        <Heading>Therapists</Heading>

        {therapists.length === 0 ? (
          <Card>
            <Text style={styles.muted}>No therapists on file yet.</Text>
          </Card>
        ) : (
          therapists.map((therapist) => (
            <Card key={therapist.id}>
              <View style={styles.cardHeader}>
                <View style={styles.therapistInfo}>
                  <Text style={styles.therapistLabel}>THERAPIST</Text>

                  <Text style={styles.therapistName}>
                    {(therapist.full_name ?? "Therapist").toUpperCase()}
                  </Text>

                  {therapist.specialties?.length ? (
                    <View style={styles.specialtySection}>
                      <Text style={styles.specialtyLabel}>SPECIALTIES</Text>
                      <Text style={styles.specialties}>
                        {therapist.specialties.join(" · ")}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`View ${therapist.full_name ?? "therapist"} profile`}
                  style={({ pressed }) => [
                    styles.profileButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.profileIcon}>
                    <View style={styles.iconHead} />
                    <View style={styles.iconBody} />
                  </View>
                </Pressable>
              </View>
            </Card>
          ))
        )}

        <View style={{ height: 4 }} />
        <SecondaryButton title="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 34,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  therapistInfo: {
    flex: 1,
    paddingRight: 12,
  },
  therapistLabel: {
    color: COLORS.inkMid,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  therapistName: {
    fontFamily: "Georgia",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: COLORS.ink,
  },
  specialtySection: {
    marginTop: 10,
  },
  specialtyLabel: {
    color: COLORS.inkMid,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  specialties: {
    color: COLORS.sageDeep,
    fontSize: 13,
    lineHeight: 18,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  profileIcon: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconHead: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.inkMid,
    marginBottom: 2,
  },
  iconBody: {
    width: 14,
    height: 7,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    backgroundColor: COLORS.inkMid,
  },
  muted: {
    color: COLORS.inkMid,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.65,
  },
});