import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
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

// Outcome-based survey per the plan: measurable before/after data instead
// of a single "how was your massage" star rating.
// NOTE: surveys.appointment_id is NOT NULL in the schema, so this screen
// requires an appointmentId param — link to it from a specific completed
// appointment (see app/client/appointments.tsx) rather than from a generic menu.
function ZeroToTenScale({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <View style={styles.scaleRow}>
      {Array.from({ length: 11 }, (_, i) => i).map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} style={[styles.scaleDot, value === n && styles.scaleDotActive]}>
          <Text style={[styles.scaleText, value === n && styles.scaleTextActive]}>{n}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function OneToFiveScale({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <View style={styles.scaleRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} style={[styles.scaleDotWide, value === n && styles.scaleDotActive]}>
          <Text style={[styles.scaleText, value === n && styles.scaleTextActive]}>{n}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function YesNoToggle({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <View style={{ flex: 1 }}>
        <SecondaryButton title={value === true ? "✓ Yes" : "Yes"} onPress={() => onChange(true)} />
      </View>
      <View style={{ flex: 1 }}>
        <SecondaryButton title={value === false ? "✓ No" : "No"} onPress={() => onChange(false)} />
      </View>
    </View>
  );
}

export default function Survey() {
  const { profile } = useAuth();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();

  const [painBefore, setPainBefore] = useState<number | null>(null);
  const [painAfter, setPainAfter] = useState<number | null>(null);
  const [sleepImproved, setSleepImproved] = useState<boolean | null>(null);
  const [stressImproved, setStressImproved] = useState<boolean | null>(null);
  const [mobilityImproved, setMobilityImproved] = useState<boolean | null>(null);
  const [communicationRating, setCommunicationRating] = useState<number | null>(null);
  const [understoodHomeCare, setUnderstoodHomeCare] = useState<boolean | null>(null);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [saving, setSaving] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (!appointmentId) return;
    supabase
      .from("surveys")
      .select("id")
      .eq("appointment_id", appointmentId)
      .maybeSingle()
      .then(({ data }) => setAlreadySubmitted(!!data));
  }, [appointmentId]);

  const canSubmit = !!appointmentId && painBefore !== null && painAfter !== null;

  async function handleSubmit() {
    if (!profile || !appointmentId || !canSubmit) return;
    setSaving(true);
    // Table: surveys — RLS "surveys_client_write" requires client_id = auth.uid();
    // appointment_id is required by the schema.
    const { error } = await supabase.from("surveys").insert({
      appointment_id: appointmentId,
      client_id: profile.id,
      pain_before: painBefore,
      pain_after: painAfter,
      sleep_improved: sleepImproved,
      stress_improved: stressImproved,
      mobility_improved: mobilityImproved,
      communication_rating: communicationRating,
      understood_home_care: understoodHomeCare,
      would_recommend: wouldRecommend,
      feedback_text: feedbackText || null,
    });
    setSaving(false);

    if (error) {
      Alert.alert("Couldn't save", error.message);
      return;
    }
    Alert.alert("Thank you", "Your feedback helps your therapist improve your care.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  if (!appointmentId) {
    return (
      <Screen>
        <Eyebrow>Post-session survey</Eyebrow>
        <Heading>No session selected</Heading>
        <Card>
          <Text style={{ color: COLORS.inkMid, lineHeight: 19 }}>
            Open this survey from a specific completed appointment on your Appointments page — each
            survey is tied to one session.
          </Text>
        </Card>
        <SecondaryButton title="Go to Appointments" onPress={() => router.push("/client/appointments")} />
      </Screen>
    );
  }

  if (alreadySubmitted) {
    return (
      <Screen>
        <Eyebrow>Post-session survey</Eyebrow>
        <Heading>Already submitted</Heading>
        <Card>
          <Text style={{ color: COLORS.inkMid }}>You've already shared feedback for this session — thank you!</Text>
        </Card>
        <SecondaryButton title="Back" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
        <Eyebrow>How did that session feel?</Eyebrow>
        <Heading>Post-Session Survey</Heading>

        <Card>
          <Label>Pain level before session (0–10)</Label>
          <ZeroToTenScale value={painBefore} onChange={setPainBefore} />
        </Card>
        <Card>
          <Label>Pain level after session (0–10)</Label>
          <ZeroToTenScale value={painAfter} onChange={setPainAfter} />
        </Card>
        <Card>
          <Label>Did your sleep improve?</Label>
          <YesNoToggle value={sleepImproved} onChange={setSleepImproved} />
        </Card>
        <Card>
          <Label>Did your stress improve?</Label>
          <YesNoToggle value={stressImproved} onChange={setStressImproved} />
        </Card>
        <Card>
          <Label>Did your mobility improve?</Label>
          <YesNoToggle value={mobilityImproved} onChange={setMobilityImproved} />
        </Card>
        <Card>
          <Label>Rate your therapist's communication (1–5)</Label>
          <OneToFiveScale value={communicationRating} onChange={setCommunicationRating} />
        </Card>
        <Card>
          <Label>Did you understand your home-care instructions?</Label>
          <YesNoToggle value={understoodHomeCare} onChange={setUnderstoodHomeCare} />
        </Card>
        <Card>
          <Label>Would you recommend this therapist?</Label>
          <YesNoToggle value={wouldRecommend} onChange={setWouldRecommend} />
        </Card>
        <Card>
          <Label>Anything your therapist could have done better? (optional)</Label>
          <FieldInput value={feedbackText} onChangeText={setFeedbackText} multiline />
        </Card>

        <PrimaryButton title="Submit Survey" onPress={handleSubmit} loading={saving} disabled={!canSubmit} />
        <View style={{ height: 9 }} />
        <SecondaryButton title="Cancel" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scaleRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4, marginBottom: 4 },
  scaleDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  scaleDotWide: {
    width: 44,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  scaleDotActive: { backgroundColor: COLORS.sageDeep, borderColor: COLORS.sageDeep },
  scaleText: { fontSize: 12, color: COLORS.inkMid },
  scaleTextActive: { color: COLORS.white, fontWeight: "700" },
});
