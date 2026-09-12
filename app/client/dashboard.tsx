import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getUpcomingAppointmentsForClient } from "@/services/appointments";
import { Screen, Eyebrow, Heading, Subheading, Card, Label, PrimaryButton, IconTile, COLORS } from "@/components/ui";
import type { Appointment } from "@/types/database.types";

export default function ClientDashboard() {
  const { profile, signOut } = useAuth();
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!profile) return;
    getUpcomingAppointmentsForClient(profile.id).then(({ data }) => {
      if (data && data.length > 0) setNextAppointment(data[0] as unknown as Appointment);
    });
  }, [profile]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const menu = [
    { href: "/client/intake", label: "Intake form", icon: "✦", desc: "Keep your wellness information updated." },
    { href: "/client/health-history", label: "Health history", icon: "♡", desc: "Review your health information." },
    { href: "/client/consent", label: "Consent & policies", icon: "✓", desc: "Review your signed documents." },
    { href: "/client/appointments", label: "Appointments", icon: "◷", desc: "View your upcoming and past sessions." },
    { href: "/client/home-care", label: "Home care", icon: "⌁", desc: "View recommendations from your therapist." },
    { href: "/client/survey", label: "Session survey", icon: "♡", desc: "Share how you felt after a session." },
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <Eyebrow>Your wellness space</Eyebrow>
        <Heading>Welcome, {firstName}</Heading>
        <Subheading>A place to rest, restore, and reconnect.</Subheading>

        <Card>
          <Label>NEXT SESSION</Label>
          {nextAppointment ? (
            <>
              <Text style={{ fontFamily: "Georgia", fontSize: 21, color: COLORS.ink, marginBottom: 5 }}>
                {new Date(nextAppointment.starts_at).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
              </Text>
              <Text style={{ color: COLORS.sageDeep, fontWeight: "700", marginBottom: 4 }}>
                {new Date(nextAppointment.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
              <Text style={{ color: COLORS.inkMid }}>{nextAppointment.service_name}</Text>
            </>
          ) : (
            <Text style={{ color: COLORS.inkMid }}>Nothing scheduled yet.</Text>
          )}
        </Card>

        <Eyebrow>My wellness</Eyebrow>
        {menu.map((item) => (
          <Link key={item.href} href={item.href as any} asChild>
            <View>
              <Card>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <IconTile icon={item.icon} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Georgia", fontSize: 17, color: COLORS.ink, marginBottom: 4 }}>{item.label}</Text>
                    <Text style={{ color: COLORS.inkMid, fontSize: 12, lineHeight: 17 }}>{item.desc}</Text>
                  </View>
                  <Text style={{ color: COLORS.gold, fontSize: 22 }}>›</Text>
                </View>
              </Card>
            </View>
          </Link>
        ))}

        <PrimaryButton title="Sign out" onPress={signOut} />
      </ScrollView>
    </Screen>
  );
}
