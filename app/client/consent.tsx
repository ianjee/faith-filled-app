import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Alert } from "react-native";
import { router } from "expo-router";
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
  Pill,
  COLORS,
} from "@/components/ui";

const CONSENT_DOCUMENT_NAME = "Treatment Consent & Policies";
const CONSENT_VERSION = "2026-06-v1";
const CONSENT_TEXT = `By signing below, you acknowledge that you have received an overview of the
treatment you are about to receive, understand its expected benefits and any risks, and
consent to receive care from your assigned therapist. This consent covers the current
session and can be withdrawn at any time before treatment begins.

This in-app signature is not a substitute for a legal review of consent requirements in
your jurisdiction — the clinic's compliance process determines what's required for
production use.`;

export default function Consent() {
  const { profile } = useAuth();
  // The real schema has no "signed name" column — typing a name here is a UX
  // confirmation step only. If you want the printed name stored for audit
  // purposes, add a `signed_name text` column to `consents` and include it below.
  const [signedName, setSignedName] = useState("");
  const [saving, setSaving] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);

  useEffect(() => {
    if (!profile) return;
    // Table: consents — RLS "consents_client" scopes to client_id = auth.uid()
    supabase
      .from("consents")
      .select("id")
      .eq("client_id", profile.id)
      .eq("document_version", CONSENT_VERSION)
      .maybeSingle()
      .then(({ data }) => setAlreadySigned(!!data));
  }, [profile?.id]);

  async function handleSign() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("consents").insert({
      client_id: profile.id,
      document_name: CONSENT_DOCUMENT_NAME,
      document_version: CONSENT_VERSION,
      agreed: true,
      agreed_at: new Date().toISOString(),
    });
    setSaving(false);

    if (error) {
      Alert.alert("Couldn't save", error.message);
      return;
    }
    Alert.alert("Signed", "Thank you — your consent has been recorded.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
        <Eyebrow>Required before treatment</Eyebrow>
        <Heading>Consent & Policies</Heading>

        {alreadySigned ? <Pill text="Signed" /> : null}

        <Card>
          <ScrollView style={{ maxHeight: 220 }}>
            <Text style={{ color: COLORS.inkMid, lineHeight: 20 }}>{CONSENT_TEXT}</Text>
          </ScrollView>
        </Card>

        {!alreadySigned && (
          <Card>
            <Label>Type your full name to sign</Label>
            <FieldInput value={signedName} onChangeText={setSignedName} placeholder="Your full legal name" />
          </Card>
        )}

        {!alreadySigned ? (
          <PrimaryButton title="I Agree & Sign" onPress={handleSign} loading={saving} disabled={!signedName} />
        ) : null}
        <View style={{ height: 9 }} />
        <SecondaryButton title="Back" onPress={() => router.back()} />

        <Text style={{ fontSize: 11, color: COLORS.inkMid, marginTop: 10 }}>
          Document version {CONSENT_VERSION}. Your signature, name, and timestamp are recorded for audit purposes.
        </Text>
      </ScrollView>
    </Screen>
  );
}
