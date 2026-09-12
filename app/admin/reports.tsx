import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Screen, Eyebrow, Heading, Card, StatCard, SecondaryButton, COLORS } from "@/components/ui";

interface ReportMetrics {
  avgPainImprovementPct: number | null;
  surveyResponseCount: number;
  wouldRecommendPct: number | null;
}

export default function AdminReports() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<ReportMetrics>({
    avgPainImprovementPct: null,
    surveyResponseCount: 0,
    wouldRecommendPct: null,
  });

  useEffect(() => {
    if (!profile?.clinic_id) return;
    // Table: surveys — RLS "surveys_admin_read" scopes to clients within this clinic.
    supabase
      .from("surveys")
      .select("pain_before, pain_after, would_recommend")
      .then(({ data }) => {
        const rows: Array<{
          pain_before: number | null;
          pain_after: number | null;
          would_recommend: boolean | null;
        }> = data ?? [];
        const painRows = rows.filter(
          (r): r is { pain_before: number; pain_after: number; would_recommend: boolean | null } =>
            r.pain_before !== null && r.pain_after !== null && r.pain_before > 0
        );
        const avgPain = painRows.length
          ? Math.round(
              painRows.reduce((sum: number, r) => sum + ((r.pain_before - r.pain_after) / r.pain_before) * 100, 0) /
                painRows.length
            )
          : null;
        const recCount = rows.filter((r) => r.would_recommend === true).length;
        const recPct = rows.length ? Math.round((recCount / rows.length) * 100) : null;

        setMetrics({
          avgPainImprovementPct: avgPain,
          surveyResponseCount: rows.length,
          wouldRecommendPct: recPct,
        });
      });
  }, [profile?.clinic_id]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
        <Eyebrow>Clinic workspace</Eyebrow>
        <Heading>Reports</Heading>

        <View style={{ flexDirection: "row", gap: 9, marginBottom: 14 }}>
          <StatCard label="Survey Responses" value={metrics.surveyResponseCount} />
          <StatCard
            label="Avg Pain Improvement"
            value={metrics.avgPainImprovementPct !== null ? `${metrics.avgPainImprovementPct}%` : "—"}
          />
          <StatCard
            label="Would Recommend"
            value={metrics.wouldRecommendPct !== null ? `${metrics.wouldRecommendPct}%` : "—"}
          />
        </View>

        <Card>
          <Text style={{ color: COLORS.inkMid, lineHeight: 19 }}>
            These figures come from client outcome surveys — pain before/after, and likelihood to
            recommend — rather than a single star rating, matching the outcome-based approach in the
            initial plan.
          </Text>
        </Card>

        <View style={{ height: 4 }} />
        <SecondaryButton title="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
