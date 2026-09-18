import React from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import {
  Screen,
  Eyebrow,
  Heading,
  Card,
  SecondaryButton,
  COLORS,
} from "@/components/ui";

export default function AdminSettings() {
  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 34, paddingTop: 30 }}
      >
        <Eyebrow>Clinic workspace</Eyebrow>
        <Heading>Settings</Heading>

        <Card>
          <Text
            style={{
              fontFamily: "Georgia",
              fontSize: 18,
              color: COLORS.ink,
              marginBottom: 5,
            }}
          >
            Clinic Information
          </Text>
          <Text style={{ color: COLORS.inkMid, fontSize: 13 }}>
            Manage your clinic name, address, phone number, and email.
          </Text>
        </Card>

        <Card>
          <Text
            style={{
              fontFamily: "Georgia",
              fontSize: 18,
              color: COLORS.ink,
              marginBottom: 5,
            }}
          >
            Appointment Settings
          </Text>
          <Text style={{ color: COLORS.inkMid, fontSize: 13 }}>
            Manage business hours, appointment duration, and booking preferences.
          </Text>
        </Card>

        <Card>
          <Text
            style={{
              fontFamily: "Georgia",
              fontSize: 18,
              color: COLORS.ink,
              marginBottom: 5,
            }}
          >
            Notifications
          </Text>
          <Text style={{ color: COLORS.inkMid, fontSize: 13 }}>
            Manage appointment, staff, and client notification preferences.
          </Text>
        </Card>

        <Card>
          <Text
            style={{
              fontFamily: "Georgia",
              fontSize: 18,
              color: COLORS.ink,
              marginBottom: 5,
            }}
          >
            Account & Security
          </Text>
          <Text style={{ color: COLORS.inkMid, fontSize: 13 }}>
            Manage your account, password, PIN, and security settings.
          </Text>
        </Card>

        <View style={{ height: 4 }} />
        <SecondaryButton title="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
