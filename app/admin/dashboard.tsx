import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Heading, Eyebrow, Card, PrimaryButton, SecondaryButton, StatCard, COLORS } from "@/components/ui";

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
          supabase.from("appointments").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId).gte("starts_at", startOfMonth.toISOString()),
        ]);
      setMetrics({ clientCount: clientCount ?? 0, therapistCount: therapistCount ?? 0, sessionsThisMonth: sessionsThisMonth ?? 0 });
    })();
  }, [profile]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingTop: 30, backgroundColor: COLORS.cream, flexGrow: 1 }}>
      <Eyebrow>Clinic workspace</Eyebrow>
      <Heading>Clinic overview</Heading>
      <Text style={{ color: COLORS.inkMid, fontSize: 15, marginBottom: 22 }}>A quick look at your practice.</Text>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 22 }}>
        <StatCard label="Clients" value={metrics?.clientCount ?? "—"} />
        <StatCard label="Therapists" value={metrics?.therapistCount ?? "—"} />
        <StatCard label="Sessions" value={metrics?.sessionsThisMonth ?? "—"} />
      </View>

      <Eyebrow>Manage</Eyebrow>
      <Card>
        <Text style={{ fontFamily: "Georgia", fontSize: 19, color: COLORS.ink, marginBottom: 6 }}>Practice management</Text>
        <Text style={{ color: COLORS.inkMid, lineHeight: 19, marginBottom: 15 }}>Access clients, therapists, reports, and clinic settings.</Text>
        <PrimaryButton title="View clients" onPress={() => router.push("/admin/clients")} />
        <View style={{ height: 9 }} />
        <PrimaryButton title="View therapists" onPress={() => router.push("/admin/therapists")} />
        <View style={{ height: 9 }} />
        <PrimaryButton title="Reports" onPress={() => router.push("/admin/reports")} />
        <View style={{ height: 9 }} />
        <SecondaryButton title="Settings" onPress={() => router.push("/admin/settings")} />
      </Card>

      <SecondaryButton title="Sign out" onPress={signOut} />
    </ScrollView>
  );
}
