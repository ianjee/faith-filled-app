import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

import {
  Screen,
  Eyebrow,
  Heading,
  Label,
  FieldInput,
  PrimaryButton,
  SecondaryButton,
  Card,
  Pill,
  COLORS,
} from "@/components/ui";

type StaffRole = "client" | "therapist" | "admin" | "owner";

const ASSIGNABLE_ROLES: StaffRole[] = [
  "client",
  "therapist",
  "admin",
];

interface StaffProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: StaffRole;
}

interface RoleActionRowProps {
  target: StaffProfile;
  onSetRole: (id: string, role: StaffRole) => void;
  busy: boolean;
}

function RoleActionRow({
  target,
  onSetRole,
  busy,
}: RoleActionRowProps) {
  return (
    <View>
      {ASSIGNABLE_ROLES.map((role) => (
        <View key={role}>
          <SecondaryButton
            title={role === target.role ? `✓ ${role}` : role}
            onPress={() => {
              if (busy || role === target.role) return;
              onSetRole(target.id, role);
            }}
          />
        </View>
      ))}
    </View>
  );
}

export default function ManageStaff() {
  const { profile } = useAuth();

  const clinicId: string | null = profile?.clinic_id ?? null;

  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<
    StaffProfile | null | undefined
  >(undefined);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    if (!clinicId) {
      setStaff([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("clinic_id", clinicId)
      .in("role", ["owner", "admin", "therapist"])
      .order("role", { ascending: true });

    if (error) {
      Alert.alert("Unable to load staff", error.message);
      return;
    }

    setStaff((data as StaffProfile[]) ?? []);
  }, [clinicId]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  async function handleSearch() {
    if (!clinicId) {
      Alert.alert(
        "Clinic not assigned",
        "Your account is not currently assigned to a clinic."
      );
      return;
    }

    const email = searchEmail.trim().toLowerCase();

    if (!email) {
      Alert.alert(
        "Email required",
        "Please enter the email address used to create the account."
      );
      return;
    }

    setSearching(true);
    setSearchResult(undefined);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("clinic_id", clinicId)
      .eq("email", email)
      .maybeSingle();

    setSearching(false);

    if (error) {
      Alert.alert("Search failed", error.message);
      return;
    }

    setSearchResult((data as StaffProfile) ?? null);
  }

  async function handleSetRole(
    targetId: string,
    role: StaffRole
  ) {
    if (!clinicId) {
      Alert.alert(
        "Clinic not assigned",
        "Your account is not currently assigned to a clinic."
      );
      return;
    }

    const target =
      targetId === searchResult?.id
        ? searchResult
        : staff.find((item) => item.id === targetId);

    const displayName =
      target?.full_name ??
      target?.email ??
      "this person";

    Alert.alert(
      "Confirm role change",
      `Set ${displayName} to "${role}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: async () => {
            setBusyId(targetId);

            const { error } = await supabase
              .from("profiles")
              .update({ role })
              .eq("id", targetId)
              .eq("clinic_id", clinicId);

            if (error) {
              setBusyId(null);
              Alert.alert(
                "Couldn't update role",
                error.message
              );
              return;
            }

            if (role === "therapist") {
              const { error: therapistError } =
                await supabase
                  .from("therapists")
                  .upsert(
                    {
                      id: targetId,
                      clinic_id: clinicId,
                    },
                    {
                      onConflict: "id",
                    }
                  );

              if (therapistError) {
                setBusyId(null);

                Alert.alert(
                  "Therapist record failed",
                  therapistError.message
                );

                return;
              }
            }

            if (role !== "therapist") {
              const { error: therapistDeleteError } =
                await supabase
                  .from("therapists")
                  .delete()
                  .eq("id", targetId)
                  .eq("clinic_id", clinicId);

              if (therapistDeleteError) {
                setBusyId(null);

                Alert.alert(
                  "Therapist record could not be removed",
                  therapistDeleteError.message
                );

                return;
              }
            }

            setBusyId(null);

            if (
              searchResult &&
              targetId === searchResult.id
            ) {
              setSearchResult({
                ...searchResult,
                role,
              });
            }

            await loadStaff();

            Alert.alert(
              "Done",
              `${displayName} is now set to "${role}".`
            );
          },
        },
      ]
    );
  }

  if (!clinicId) {
    return (
      <Screen>
        <Eyebrow>Clinic workspace</Eyebrow>

        <Heading>Manage Staff</Heading>

        <Card>
          <Text style={{ color: COLORS.inkMid }}>
            Your account is not currently assigned to a clinic.
          </Text>
        </Card>

        <SecondaryButton
          title="Back"
          onPress={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 34 }}
      >
        <Eyebrow>Clinic workspace</Eyebrow>

        <Heading>Manage Staff</Heading>

        <Text
          style={{
            color: COLORS.inkMid,
            lineHeight: 19,
            marginBottom: 12,
          }}
        >
          Look someone up by the email they signed up
          with, then set their role. They must have
          created an account already.
        </Text>

        <Card>
          <Label>Find a person by email</Label>

          <FieldInput
            value={searchEmail}
            onChangeText={setSearchEmail}
            placeholder="person@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <PrimaryButton
            title="Search"
            onPress={() => {
              if (!searchEmail.trim() || searching) return;
              handleSearch();
            }}
            loading={searching}
          />
        </Card>

        {searchResult === null ? (
          <Card>
            <Text style={{ color: COLORS.inkMid }}>
              No account found with that email in your
              clinic. Ask them to sign up first.
            </Text>
          </Card>
        ) : null}

        {searchResult ? (
          <Card>
            <Text
              style={{
                fontFamily: "Georgia",
                fontSize: 17,
                color: COLORS.ink,
                marginBottom: 2,
              }}
            >
              {searchResult.full_name ?? "Unnamed"}
            </Text>

            <Text
              style={{
                color: COLORS.inkMid,
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              {searchResult.email ?? "No email"}
            </Text>

            <Pill
              text={`Currently: ${searchResult.role}`}
            />

            <RoleActionRow
              target={searchResult}
              onSetRole={handleSetRole}
              busy={busyId === searchResult.id}
            />
          </Card>
        ) : null}

        <View
          style={{
            marginTop: 16,
            marginBottom: 4,
          }}
        >
          <Eyebrow>Current staff</Eyebrow>
        </View>

        {staff.length === 0 ? (
          <Card>
            <Text style={{ color: COLORS.inkMid }}>
              No admins, owners, or therapists on file yet.
            </Text>
          </Card>
        ) : (
          staff.map((member) => (
            <Card key={member.id}>
              <Text
                style={{
                  fontFamily: "Georgia",
                  fontSize: 16,
                  color: COLORS.ink,
                  marginBottom: 2,
                }}
              >
                {member.full_name ?? "Unnamed"}
              </Text>

              <Text
                style={{
                  color: COLORS.inkMid,
                  fontSize: 12,
                  marginBottom: 6,
                }}
              >
                {member.email ?? "No email"}
              </Text>

              <Pill text={member.role} />

              <RoleActionRow
                target={member}
                onSetRole={handleSetRole}
                busy={busyId === member.id}
              />
            </Card>
          ))
        )}

        <View style={{ height: 4 }} />

        <SecondaryButton
          title="Back"
          onPress={() => router.back()}
        />
      </ScrollView>
    </Screen>
  );
}