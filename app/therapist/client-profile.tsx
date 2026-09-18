import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getClientProfile } from "@/services/clients";
import {
  Heading,
  Card,
  Label,
  Pill,
  SecondaryButton,
  COLORS,
} from "@/components/ui";

export default function ClientProfile() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    getClientProfile(clientId).then(({ data }) => {
      setProfileData(data);
      setLoading(false);
    });
  }, [clientId]);

  if (loading) {
    return (
      <ScrollView
        style={{ backgroundColor: COLORS.cream }}
        contentContainerStyle={{ padding: 20, paddingTop: 50, paddingBottom: 34 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "60%", height: 24, borderRadius: 5, backgroundColor: COLORS.border, marginBottom: 22 }} />

        {[1, 2, 3].map((item) => (
          <Card key={item}>
            <View style={{ width: 70, height: 9, borderRadius: 4, backgroundColor: COLORS.border, marginBottom: 14 }} />
            <View style={{ width: "90%", height: 12, borderRadius: 5, backgroundColor: COLORS.border, marginBottom: 9 }} />
            <View style={{ width: "70%", height: 12, borderRadius: 5, backgroundColor: COLORS.border }} />
            {item === 2 ? (
              <View style={{ width: "50%", height: 12, borderRadius: 5, backgroundColor: COLORS.border, marginTop: 9 }} />
            ) : null}
          </Card>
        ))}
      </ScrollView>
    );
  }

  if (!profileData) {
    return (
      <ScrollView
        style={{ backgroundColor: COLORS.cream }}
        contentContainerStyle={{ padding: 20, paddingTop: 50, paddingBottom: 34, flexGrow: 1 }}
      >
        <Text style={{ color: COLORS.inkMid }}>Unable to load client profile.</Text>
        <View style={{ height: 12 }} />
        <SecondaryButton title="Back" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  const intake = profileData.intake_forms?.[0];
  const health = profileData.health_histories?.[0];
  const consents: any[] = profileData.consents ?? [];

  return (
    <ScrollView
      style={{ backgroundColor: COLORS.cream }}
      contentContainerStyle={{ padding: 20, paddingTop: 50, paddingBottom: 34, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
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
          consents.map((c) => (
            <Pill key={c.id} text={`${c.document_name} · signed`} />
          ))
        ) : (
          <Text style={{ color: "#B3261E" }}>
            No consent on file — do not begin treatment.
          </Text>
        )}
      </Card>

      <View style={{ height: 4 }} />
      <SecondaryButton title="Back" onPress={() => router.back()} />
    </ScrollView>
  );
}