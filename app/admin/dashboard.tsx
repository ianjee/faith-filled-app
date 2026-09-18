import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  Heading,
  Eyebrow,
  Card,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  COLORS,
} from "@/components/ui";

interface ClinicMetrics {
  clientCount: number;
  therapistCount: number;
  sessionsThisMonth: number;
}

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [metrics, setMetrics] = useState<ClinicMetrics | null>(null);

  useEffect(() => {
    if (!profile?.clinic_id) {
      setMetrics(null);
      return;
    }

    const clinicId = profile.clinic_id;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    async function loadMetrics() {
      const [clientResult, therapistResult, sessionsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("clinic_id", clinicId)
          .eq("role", "client"),

        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("clinic_id", clinicId)
          .eq("role", "therapist"),

        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("clinic_id", clinicId)
          .gte("starts_at", startOfMonth.toISOString()),
      ]);

      if (clientResult.error) {
        console.warn("Failed to count clients:", clientResult.error.message);
      }

      if (therapistResult.error) {
        console.warn("Failed to count therapists:", therapistResult.error.message);
      }

      if (sessionsResult.error) {
        console.warn("Failed to count sessions:", sessionsResult.error.message);
      }

      setMetrics({
        clientCount: clientResult.count ?? 0,
        therapistCount: therapistResult.count ?? 0,
        sessionsThisMonth: sessionsResult.count ?? 0,
      });
    }

    loadMetrics();
  }, [profile?.clinic_id]);

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err: any) {
      Alert.alert("Sign out failed", err?.message ?? "Please try again.");
      return;
    }

    router.replace("/(auth)/login");
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        padding: 22,
        paddingTop: 30,
        backgroundColor: COLORS.cream,
        flexGrow: 1,
      }}
    >
      <Eyebrow>Clinic workspace</Eyebrow>
      <Heading>Clinic overview</Heading>
      <Text style={{ color: COLORS.inkMid, fontSize: 15, marginBottom: 22 }}>
        A quick look at your practice.
      </Text>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 22 }}>
        <StatCard label="Clients" value={metrics?.clientCount ?? "—"} />
        <StatCard label="Therapists" value={metrics?.therapistCount ?? "—"} />
        <StatCard label="Sessions" value={metrics?.sessionsThisMonth ?? "—"} />
      </View>

      <Eyebrow>Manage</Eyebrow>
      <Card>
        <Text style={{ fontFamily: "Georgia", fontSize: 19, color: COLORS.ink, marginBottom: 6 }}>
          Practice management
        </Text>
        <Text style={{ color: COLORS.inkMid, lineHeight: 19, marginBottom: 15 }}>
          Access clients, therapists, reports, and clinic settings.
        </Text>
        <PrimaryButton title="View clients" onPress={() => router.push("/admin/clients")} />
        <View style={{ height: 9 }} />
        <PrimaryButton title="View therapists" onPress={() => router.push("/admin/therapists")} />
        <View style={{ height: 9 }} />
        <PrimaryButton title="Manage Staff" onPress={() => router.push("/admin/staff")} />
        <View style={{ height: 9 }} />
        <PrimaryButton title="Reports" onPress={() => router.push("/admin/reports")} />
        <View style={{ height: 9 }} />
        <SecondaryButton title="Settings" onPress={() => router.push("/admin/settings")} />
      </Card>

      <SecondaryButton title="Sign out" onPress={handleSignOut} />
    </ScrollView>
  );
}