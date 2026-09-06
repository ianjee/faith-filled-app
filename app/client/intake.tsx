import React, { useState } from "react";
import { ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { submitIntakeForm } from "@/services/clientRecords";
import { Heading, Label, FieldInput, PrimaryButton, COLORS } from "@/components/ui";

export default function IntakeForm() {
  const { profile } = useAuth();
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [goals, setGoals] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    const { error } = await submitIntakeForm(profile.id, {
      reason_for_visit: reasonForVisit,
      goals,
      referred_by: referredBy,
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
      <Heading>Intake form</Heading>

      <Label>What brings you in today?</Label>
      <FieldInput
        value={reasonForVisit}
        onChangeText={setReasonForVisit}
        multiline
        numberOfLines={3}
        placeholder="e.g. lower back tension, stress relief"
      />

      <Label>What are your goals for treatment?</Label>
      <FieldInput
        value={goals}
        onChangeText={setGoals}
        multiline
        numberOfLines={3}
        placeholder="e.g. reduce pain, improve mobility"
      />

      <Label>Referred by (optional)</Label>
      <FieldInput value={referredBy} onChangeText={setReferredBy} placeholder="Doctor, friend, gym…" />

      {error && <Text style={{ color: "#B3261E", marginBottom: 10 }}>{error}</Text>}

      <PrimaryButton title="Submit intake form" onPress={handleSubmit} loading={saving} />
    </ScrollView>
  );
}
