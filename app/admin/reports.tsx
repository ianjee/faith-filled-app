import React, { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Heading, Card, Label, COLORS } from "@/components/ui";

interface SurveyRow {
  pain_before: number | null;
  pain_after: number | null;
  would_recommend: boolean | null;
}

export default function AdminReports() {
  const { profile } = useAuth();
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);

  useEffect(() => {
    if (!profile?.clinic_id) return;
    // Basic V1 report: RLS scopes this to surveys for clients in the admin's clinic.
    supabase
      .from("surveys")
      .select("pain_before, pain_after, would_recommend")
      .then(({ data }) => setSurveys((data as SurveyRow[]) ?? []));
  }, [profile]);

  const withPain = surveys.filter((s) => s.pain_before != null && s.pain_after != null);
  const avgImprovement =
    withPain.length > 0
      ? Math.round(
          (withPain.reduce((sum, s) => sum + ((s.pain_before! - s.pain_after!) / s.pain_before!), 0) /
            withPain.length) *
            100
        )
      : null;

  const recommendResponses = surveys.filter((s) => s.would_recommend != null);
  const recommendRate =
    recommendResponses.length > 0
      ? Math.round(
          (recommendResponses.filter((s) => s.would_recommend).length / recommendResponses.length) * 100
        )
      : null;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: COLORS.cream, flexGrow: 1 }}>
      <Heading>Reports</Heading>

      <Card>
        <Label>Average pain improvement</Label>
        <Text style={{ fontSize: 28, fontWeight: "700", color: COLORS.sageDeep }}>
          {avgImprovement != null ? `${avgImprovement}%` : "—"}
        </Text>
        <Text style={{ color: COLORS.inkMid, marginTop: 4 }}>
          Based on {withPain.length} survey response(s) with before/after pain scores.
        </Text>
      </Card>

      <Card>
        <Label>Would recommend</Label>
        <Text style={{ fontSize: 28, fontWeight: "700", color: COLORS.sageDeep }}>
          {recommendRate != null ? `${recommendRate}%` : "—"}
        </Text>
        <Text style={{ color: COLORS.inkMid, marginTop: 4 }}>
          Based on {recommendResponses.length} response(s).
        </Text>
      </Card>

      <Text style={{ color: COLORS.inkMid, fontSize: 11, marginTop: 10 }}>
        Advanced reporting (per-therapist trends, charts over time) is a Version 2 feature —
        see the roadmap.
      </Text>
    </ScrollView>
  );
}
