import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { signConsent } from "@/services/clientRecords";
import { Heading, Card, Label, PrimaryButton, COLORS } from "@/components/ui";

const CONSENT_DOCUMENT_NAME = "Informed Consent & Policies";
const CONSENT_VERSION = "v1.0";

export default function Consent() {
  const { profile } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAgree = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    const { error } = await signConsent(profile.id, CONSENT_DOCUMENT_NAME, CONSENT_VERSION);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setAgreed(true);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={{ backgroundColor: COLORS.cream, padding: 20, flexGrow: 1 }}>
      <Heading>Consent & policies</Heading>

      <Card>
        <Text style={{ color: COLORS.inkMid, lineHeight: 20 }}>
          By continuing, you acknowledge that you have read and understood our treatment
          policies, cancellation policy, and privacy practices. This screen records your
          agreement, the document version, and a timestamp.
        </Text>
      </Card>

      <View style={{ marginBottom: 16 }}>
        <Label>Document</Label>
        <Text style={{ color: COLORS.ink }}>
          {CONSENT_DOCUMENT_NAME} ({CONSENT_VERSION})
        </Text>
      </View>

      {error && <Text style={{ color: "#B3261E", marginBottom: 10 }}>{error}</Text>}

      <PrimaryButton
        title={agreed ? "Signed ✓" : "I agree — sign electronically"}
        onPress={handleAgree}
        loading={saving}
        disabled={agreed}
      />

      <Text style={{ color: COLORS.inkMid, fontSize: 11, marginTop: 12 }}>
        Note: a drawn or tapped signature does not automatically satisfy every jurisdiction's
        legal requirements for electronic signatures on health records. Have the business/legal
        side validate this flow before relying on it in production.
      </Text>
    </ScrollView>
  );
}
