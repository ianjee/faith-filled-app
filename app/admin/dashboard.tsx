import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Heading, Card, Label, PrimaryButton, COLORS } from "@/components/ui";

interface ClinicMetrics {
  clientCount: number;
  therapistCount: number;
  sessionsThisMonth: number;
}

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [metrics, setMetrics] = useState<ClinicMetrics | null>(null);

  useEffect(() => {
    if (!profile?.clinic_id) return;
    const clinicId = profile.clinic_id;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    (async () => {
      const [{ count: clientCount }, { count: therapistCount }, { count: sessionsThisMonth }] =
        await Promise.all([
          supabase.from("clients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
          supabase.from("therapists").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
          supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("clinic_id", clinicId)
            .gte("starts_at", startOfMonth.toISOString()),
        ]);
      setMetrics({
        clientCount: clientCount ?? 0,
        therapistCount: therapistCount ?? 0,
        sessionsThisMonth: sessionsThisMonth ?? 0,
      });
    })();
  }, [profile]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: COLORS.cream, flexGrow: 1 }}>
      <Heading>Clinic overview</Heading>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
        <Card>
          <Label>Clients</Label>
          <Text style={{ fontSize: 26, fontWeight: "700", color: COLORS.sageDeep }}>
            {metrics?.clientCount ?? "—"}
          </Text>
        </Card>
        <Card>
          <Label>Therapists</Label>
          <Text style={{ fontSize: 26, fontWeight: "700", color: COLORS.sageDeep }}>
            {metrics?.therapistCount ?? "—"}
          </Text>
        </Card>
        <Card>
          <Label>Sessions (mo.)</Label>
          <Text style={{ fontSize: 26, fontWeight: "700", color: COLORS.sageDeep }}>
            {metrics?.sessionsThisMonth ?? "—"}
          </Text>
        </Card>
      </View>

      <PrimaryButton title="View clients" onPress={() => router.push("/admin/clients")} />
      <View style={{ height: 10 }} />
      <PrimaryButton title="View therapists" onPress={() => router.push("/admin/therapists")} />
      <View style={{ height: 10 }} />
      <PrimaryButton title="Reports" onPress={() => router.push("/admin/reports")} />
      <View style={{ height: 10 }} />
      <PrimaryButton title="Settings" onPress={() => router.push("/admin/settings")} />
      <View style={{ height: 20 }} />
      <PrimaryButton title="Sign out" onPress={signOut} />
    </ScrollView>
  );
}
