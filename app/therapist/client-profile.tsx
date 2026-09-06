import React, { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getClientProfile } from "@/services/clients";
import { Heading, Card, Label, Pill, COLORS } from "@/components/ui";

export default function ClientProfile() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (!clientId) return;
    getClientProfile(clientId).then(({ data }) => setProfileData(data));
  }, [clientId]);

  if (!profileData) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: COLORS.cream, flexGrow: 1 }}>
        <Text style={{ color: COLORS.inkMid }}>Loading client…</Text>
      </ScrollView>
    );
  }

  const intake = profileData.intake_forms?.[0];
  const health = profileData.health_histories?.[0];
  const consents: any[] = profileData.consents ?? [];

  return (
    <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: COLORS.cream, flexGrow: 1 }}>
      <Heading>{profileData.profiles?.full_name ?? "Client"}</Heading>

      <Card>
        <Label>Intake</Label>
        {intake ? (
          <>
            <Text style={{ color: COLORS.ink }}>
              Reason for visit: {intake.responses?.reason_for_visit ?? "—"}
            </Text>
            <Text style={{ color: COLORS.ink, marginTop: 4 }}>
              Goals: {intake.responses?.goals ?? "—"}
            </Text>
          </>
        ) : (
          <Text style={{ color: COLORS.inkMid }}>Not submitted yet.</Text>
        )}
      </Card>

      <Card>
        <Label>Health history</Label>
        {health ? (
          <>
            <Text style={{ color: COLORS.ink }}>
              Conditions: {health.conditions?.join(", ") || "None reported"}
            </Text>
            <Text style={{ color: COLORS.ink, marginTop: 4 }}>
              Medications: {health.medications?.join(", ") || "None reported"}
            </Text>
            {health.notes ? (
              <Text style={{ color: COLORS.inkMid, marginTop: 4 }}>{health.notes}</Text>
            ) : null}
          </>
        ) : (
          <Text style={{ color: COLORS.inkMid }}>Not submitted yet.</Text>
        )}
      </Card>

      <Card>
        <Label>Consent status</Label>
        {consents.length > 0 ? (
          consents.map((c) => <Pill key={c.id} text={`${c.document_name} · signed`} />)
        ) : (
          <Text style={{ color: "#B3261E" }}>No consent on file — do not begin treatment.</Text>
        )}
      </Card>
    </ScrollView>
  );
}
