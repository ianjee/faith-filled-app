import React from "react";
import { ScrollView, Text } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { Heading, Card, Label, COLORS } from "@/components/ui";

export default function AdminSettings() {
  const { profile } = useAuth();

  return (
    <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: COLORS.cream, flexGrow: 1 }}>
      <Heading>Settings</Heading>

      <Card>
        <Label>Signed in as</Label>
        <Text style={{ color: COLORS.ink }}>{profile?.full_name}</Text>
        <Text style={{ color: COLORS.inkMid, marginTop: 2 }}>Role: {profile?.role}</Text>
      </Card>

      <Card>
        <Label>Managing users & permissions</Label>
        <Text style={{ color: COLORS.inkMid, lineHeight: 20 }}>
          In V1, elevate a user to therapist/admin by updating their row in the `profiles`
          table (role + clinic_id) from the Supabase dashboard, or via a Supabase Edge
          Function once you're ready to build an in-app invite flow.
        </Text>
      </Card>

      <Card>
        <Label>Data & compliance</Label>
        <Text style={{ color: COLORS.inkMid, lineHeight: 20 }}>
          This clinic's data is isolated by Row Level Security (see supabase/migrations).
          Remember: the free Supabase tier is not HIPAA-enabled — confirm your compliance
          plan before storing real client health data in production.
        </Text>
      </Card>
    </ScrollView>
  );
}
