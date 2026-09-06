import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { submitSurvey } from "@/services/clientRecords";
import { Heading, Label, FieldInput, PrimaryButton, COLORS } from "@/components/ui";

function PainScale({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.scaleRow}>
      {Array.from({ length: 11 }, (_, n) => n).map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          style={[styles.scaleDot, value === n && styles.scaleDotActive]}
        >
          <Text style={[styles.scaleDotText, value === n && styles.scaleDotTextActive]}>{n}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function YesNoToggle({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
      {[
        { label: "Yes", val: true },
        { label: "No", val: false },
      ].map((opt) => (
        <Pressable
          key={opt.label}
          onPress={() => onChange(opt.val)}
          style={[styles.toggle, value === opt.val && styles.toggleActive]}
        >
          <Text style={[styles.toggleText, value === opt.val && styles.toggleTextActive]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function PostSessionSurvey() {
  const { profile } = useAuth();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();

  const [painBefore, setPainBefore] = useState(5);
  const [painAfter, setPainAfter] = useState(5);
  const [sleepImproved, setSleepImproved] = useState<boolean | null>(null);
  const [mobilityImproved, setMobilityImproved] = useState<boolean | null>(null);
  const [understoodHomeCare, setUnderstoodHomeCare] = useState<boolean | null>(null);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!profile || !appointmentId) return;
    setSaving(true);
    setError(null);
    const { error } = await submitSurvey({
      appointment_id: appointmentId,
      client_id: profile.id,
      pain_before: painBefore,
      pain_after: painAfter,
      sleep_improved: sleepImproved,
      stress_improved: null,
      mobility_improved: mobilityImproved,
      communication_rating: null,
      understood_home_care: understoodHomeCare,
      would_recommend: wouldRecommend,
      feedback_text: feedback || null,
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
      <Heading>How did that session go?</Heading>

      <Label>Pain before session</Label>
      <PainScale value={painBefore} onChange={setPainBefore} />

      <Label>Pain after session</Label>
      <PainScale value={painAfter} onChange={setPainAfter} />

      <Label>Did your sleep improve?</Label>
      <YesNoToggle value={sleepImproved} onChange={setSleepImproved} />

      <Label>Did your range of motion improve?</Label>
      <YesNoToggle value={mobilityImproved} onChange={setMobilityImproved} />

      <Label>Did you understand your home-care instructions?</Label>
      <YesNoToggle value={understoodHomeCare} onChange={setUnderstoodHomeCare} />

      <Label>Would you recommend this therapist?</Label>
      <YesNoToggle value={wouldRecommend} onChange={setWouldRecommend} />

      <Label>Anything your therapist could have done better? (optional)</Label>
      <FieldInput value={feedback} onChangeText={setFeedback} multiline numberOfLines={3} />

      {error && <Text style={{ color: "#B3261E", marginBottom: 10 }}>{error}</Text>}

      <PrimaryButton title="Submit survey" onPress={handleSubmit} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scaleRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  scaleDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scaleDotActive: { backgroundColor: COLORS.sageDeep, borderColor: COLORS.sageDeep },
  scaleDotText: { fontSize: 12, color: COLORS.ink },
  scaleDotTextActive: { color: COLORS.white, fontWeight: "700" },
  toggle: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  toggleActive: { backgroundColor: COLORS.sageDeep, borderColor: COLORS.sageDeep },
  toggleText: { color: COLORS.ink, fontWeight: "600" },
  toggleTextActive: { color: COLORS.white },
});
