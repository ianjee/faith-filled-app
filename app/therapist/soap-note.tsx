import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getSoapNoteForAppointment, saveSoapNoteDraft, signSoapNote } from "@/services/soapNotes";
import { Heading, Label, FieldInput, PrimaryButton, COLORS } from "@/components/ui";

export default function SoapNoteScreen() {
  const { profile } = useAuth();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();

  const [noteId, setNoteId] = useState<string | undefined>(undefined);
  const [subjective, setSubjective] = useState("");
  const [painBefore, setPainBefore] = useState("");
  const [objective, setObjective] = useState("");
  const [rangeOfMotion, setRangeOfMotion] = useState("");
  const [assessment, setAssessment] = useState("");
  const [planNextTreatment, setPlanNextTreatment] = useState("");
  const [planHomeCare, setPlanHomeCare] = useState("");
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appointmentId) return;
    getSoapNoteForAppointment(appointmentId).then(({ data }) => {
      if (!data) return;
      setNoteId(data.id);
      setSubjective(data.subjective ?? "");
      setPainBefore(data.pain_before?.toString() ?? "");
      setObjective(data.objective ?? "");
      setRangeOfMotion(data.range_of_motion ?? "");
      setAssessment(data.assessment ?? "");
      setPlanNextTreatment(data.plan_next_treatment ?? "");
      setPlanHomeCare(data.plan_home_care ?? "");
      setSignedAt(data.signed_at);
    });
  }, [appointmentId]);

  const isSigned = !!signedAt;

  const handleSaveDraft = async () => {
    if (!profile || !appointmentId) return;
    setSaving(true);
    setError(null);
    const { data, error } = await saveSoapNoteDraft(
      {
        appointment_id: appointmentId,
        therapist_id: profile.id,
        subjective,
        pain_before: painBefore ? Number(painBefore) : null,
        objective,
        range_of_motion: rangeOfMotion,
        assessment,
        plan_next_treatment: planNextTreatment,
        plan_home_care: planHomeCare,
      },
      noteId
    );
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data) setNoteId(data.id);
  };

  const handleSign = async () => {
    if (!noteId || !profile) return;
    setSaving(true);
    const { error } = await signSoapNote(noteId, profile.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={{ backgroundColor: COLORS.cream, padding: 20, flexGrow: 1 }}>
      <Heading>SOAP note</Heading>
      {isSigned && (
        <View style={styles.signedBanner}>
          <Text style={styles.signedText}>
            Signed {new Date(signedAt!).toLocaleString()} — read-only
          </Text>
        </View>
      )}

      <Label>S — Subjective (what the client reports)</Label>
      <FieldInput
        value={subjective}
        onChangeText={setSubjective}
        editable={!isSigned}
        multiline
        numberOfLines={3}
      />
      <Label>Pain level before (0–10)</Label>
      <FieldInput
        value={painBefore}
        onChangeText={setPainBefore}
        editable={!isSigned}
        keyboardType="number-pad"
        placeholder="0–10"
      />

      <Label>O — Objective (what you observe)</Label>
      <FieldInput
        value={objective}
        onChangeText={setObjective}
        editable={!isSigned}
        multiline
        numberOfLines={3}
      />
      <Label>Range of motion</Label>
      <FieldInput value={rangeOfMotion} onChangeText={setRangeOfMotion} editable={!isSigned} />

      <Label>A — Assessment</Label>
      <FieldInput
        value={assessment}
        onChangeText={setAssessment}
        editable={!isSigned}
        multiline
        numberOfLines={3}
      />

      <Label>P — Plan: next treatment</Label>
      <FieldInput
        value={planNextTreatment}
        onChangeText={setPlanNextTreatment}
        editable={!isSigned}
        multiline
        numberOfLines={2}
      />
      <Label>P — Plan: home care</Label>
      <FieldInput
        value={planHomeCare}
        onChangeText={setPlanHomeCare}
        editable={!isSigned}
        multiline
        numberOfLines={2}
      />

      {error && <Text style={{ color: "#B3261E", marginBottom: 10 }}>{error}</Text>}

      {!isSigned && (
        <>
          <PrimaryButton title="Save draft" onPress={handleSaveDraft} loading={saving} />
          <View style={{ height: 10 }} />
          <Pressable onPress={handleSign} disabled={!noteId || saving} style={styles.signButton}>
            <Text style={styles.signButtonText}>Sign & finalize note</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  signedBanner: {
    backgroundColor: "#F5EDE2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: 10,
    marginBottom: 14,
  },
  signedText: { color: "#633806", fontSize: 12, fontWeight: "600" },
  signButton: {
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
  },
  signButtonText: { color: COLORS.gold, fontWeight: "700" },
});
