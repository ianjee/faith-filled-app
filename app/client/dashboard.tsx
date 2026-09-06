import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getUpcomingAppointmentsForClient } from "@/services/appointments";
import { Screen, Heading, Card, Label, PrimaryButton, COLORS } from "@/components/ui";
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

  return (
    <Screen>
      <Heading>Welcome, {profile?.full_name?.split(" ")[0] ?? "there"}</Heading>

      <Card>
        <Label>Next appointment</Label>
        {nextAppointment ? (
          <Text style={{ fontSize: 16, color: COLORS.ink }}>
            {new Date(nextAppointment.starts_at).toLocaleString([], {
              weekday: "long",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        ) : (
          <Text style={{ color: COLORS.inkMid }}>Nothing scheduled yet.</Text>
        )}
      </Card>

      {[
        { href: "/client/intake", label: "Intake form" },
        { href: "/client/health-history", label: "Health history" },
        { href: "/client/consent", label: "Consent & policies" },
        { href: "/client/appointments", label: "Appointment history" },
        { href: "/client/home-care", label: "Home care recommendations" },
        { href: "/client/survey", label: "Post-session survey" },
      ].map((item) => (
        <Link key={item.href} href={item.href as any} asChild>
          <View>
            <Card>
              <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.ink }}>
                {item.label}
              </Text>
            </Card>
          </View>
        </Link>
      ))}

      <PrimaryButton title="Sign out" onPress={signOut} />
    </Screen>
  );
}
