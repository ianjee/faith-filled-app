import React, { useState } from "react";
import { ScrollView, Text, View, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/appDb";
import {
  Screen,
  Eyebrow,
  Heading,
  Label,
  FieldInput,
  PrimaryButton,
  SecondaryButton,
  Card,
  COLORS,
} from "@/components/ui";

export default function IntakeForm() {
  const { profile } = useAuth();
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [primaryConcerns, setPrimaryConcerns] = useState("");
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    // Table: intake_forms — RLS policy "intake_client_write" requires client_id = auth.uid().
    // The real schema stores all answers in a single `responses` jsonb column
    // rather than separate columns, so we shape the form fields into an object.
    const { error } = await db.from("intake_forms").insert({
      client_id: profile.id,
      responses: {
        reason_for_visit: reasonForVisit,
        primary_concerns: primaryConcerns,
        medications: medications || null,
        allergies: allergies || null,
      },
      submitted_at: new Date().toISOString(),
    });
    setSaving(false);

    if (error) {
      Alert.alert("Couldn't save", error.message);
      return;
    }
    Alert.alert("Saved", "Your intake form has been submitted.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
        <Eyebrow>Before your session</Eyebrow>
        <Heading>Intake Form</Heading>

        <Card>
          <Label>Reason for visit</Label>
          <FieldInput
            value={reasonForVisit}
            onChangeText={setReasonForVisit}
            placeholder="e.g. lower back tension"
            multiline
          />
          <Label>Primary concerns</Label>
          <FieldInput
            value={primaryConcerns}
            onChangeText={setPrimaryConcerns}
            placeholder="Anything you'd like your therapist to know"
            multiline
          />
          <Label>Current medications (optional)</Label>
          <FieldInput value={medications} onChangeText={setMedications} placeholder="e.g. ibuprofen as needed" />
          <Label>Allergies (optional)</Label>
          <FieldInput value={allergies} onChangeText={setAllergies} placeholder="e.g. lavender" />
        </Card>

        <PrimaryButton title="Submit Intake Form" onPress={handleSave} loading={saving} disabled={!reasonForVisit} />
        <View style={{ height: 9 }} />
        <SecondaryButton title="Cancel" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
