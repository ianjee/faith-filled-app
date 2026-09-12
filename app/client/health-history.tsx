import React, { useEffect, useState } from "react";
import { ScrollView, View, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import {
  Screen,
  Eyebrow,
  Heading,
  Label,
  FieldInput,
  PrimaryButton,
  SecondaryButton,
  Card,
} from "@/components/ui";

export default function HealthHistory() {
  const { profile } = useAuth();
  const [conditions, setConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [notes, setNotes] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    // Table: health_histories — RLS "health_history_client" scopes to client_id = auth.uid()
    supabase
      .from("health_histories")
      .select("*")
      .eq("client_id", profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingId(data.id);
          setConditions((data.conditions ?? []).join(", "));
          setMedications((data.medications ?? []).join(", "));
          setNotes(data.notes ?? "");
        }
      });
  }, [profile?.id]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const payload: Database["public"]["Tables"]["health_histories"]["Insert"] = {
      client_id: profile.id,
      conditions: conditions.split(",").map((c) => c.trim()).filter(Boolean),
      medications: medications.split(",").map((m) => m.trim()).filter(Boolean),
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = existingId
      ? await supabase.from("health_histories").update(payload).eq("id", existingId)
      : await supabase.from("health_histories").insert(payload);
    setSaving(false);

    if (error) {
      Alert.alert("Couldn't save", error.message);
      return;
    }
    Alert.alert("Saved", "Your health history has been updated.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
        <Eyebrow>Keep this current</Eyebrow>
        <Heading>Health History</Heading>

        <Card>
          <Label>Existing conditions (comma-separated)</Label>
          <FieldInput value={conditions} onChangeText={setConditions} placeholder="e.g. sciatica, hypertension" />
          <Label>Current medications (comma-separated)</Label>
          <FieldInput value={medications} onChangeText={setMedications} placeholder="e.g. ibuprofen, lisinopril" />
          <Label>Additional notes (optional)</Label>
          <FieldInput value={notes} onChangeText={setNotes} multiline />
        </Card>

        <PrimaryButton title="Save Health History" onPress={handleSave} loading={saving} />
        <View style={{ height: 9 }} />
        <SecondaryButton title="Cancel" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
