import React, { useState } from "react";
import { ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { upsertHealthHistory } from "@/services/clientRecords";
import { Heading, Label, FieldInput, PrimaryButton, COLORS } from "@/components/ui";

export default function HealthHistory() {
  const { profile } = useAuth();
  const [conditions, setConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    const { error } = await upsertHealthHistory(profile.id, {
      conditions: conditions.split(",").map((c) => c.trim()).filter(Boolean),
      medications: medications.split(",").map((m) => m.trim()).filter(Boolean),
      notes,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={{ backgroundColor: COLORS.cream, padding: 20, flexGrow: 1 }}>
      <Heading>Health history</Heading>

      <Label>Existing conditions (comma-separated)</Label>
      <FieldInput
        value={conditions}
        onChangeText={setConditions}
        placeholder="e.g. herniated disc, sciatica"
      />

      <Label>Current medications (comma-separated)</Label>
      <FieldInput value={medications} onChangeText={setMedications} placeholder="e.g. ibuprofen" />

      <Label>Anything else your therapist should know?</Label>
      <FieldInput value={notes} onChangeText={setNotes} multiline numberOfLines={4} />

      {error && <Text style={{ color: "#B3261E", marginBottom: 10 }}>{error}</Text>}

      <PrimaryButton title="Save health history" onPress={handleSave} loading={saving} />
    </ScrollView>
  );
}
