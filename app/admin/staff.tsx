import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  View,
  TextInput,
  Pressable,
} from "react-native";
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
    <View style={{ marginTop: 8 }}>
      {ASSIGNABLE_ROLES.map((role) => (
        <View key={role} style={{ marginBottom: 6 }}>
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

function EditRoleButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Edit account role"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 34,
          height: 34,
          borderRadius: 17,
          borderWidth: 1,
          borderColor: COLORS.border,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.white,
        },
        pressed && { opacity: 0.6 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text
        style={{
          fontSize: 17,
          color: COLORS.inkMid,
          lineHeight: 20,
        }}
      >
        ✎
      </Text>
    </Pressable>
  );
}

export default function ManageStaff() {
  const { profile } = useAuth();

  const clinicId: string | null = profile?.clinic_id ?? null;

  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showAddTherapist, setShowAddTherapist] =
    useState(false);

  const [showExistingAccounts, setShowExistingAccounts] =
    useState(false);

  const [accountSearch, setAccountSearch] = useState("");

  const [allAccounts, setAllAccounts] =
    useState<StaffProfile[]>([]);

  const [editingRoleId, setEditingRoleId] =
    useState<string | null>(null);

  const [newTherapist, setNewTherapist] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [creatingTherapist, setCreatingTherapist] =
    useState(false);

  const loadAllAccounts = useCallback(async () => {
    if (!clinicId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("clinic_id", clinicId)
      .order("full_name", { ascending: true });

    if (error) {
      Alert.alert(
        "Unable to load accounts",
        error.message
      );
      return;
    }

    setAllAccounts((data as StaffProfile[]) ?? []);
  }, [clinicId]);

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
      Alert.alert(
        "Unable to load staff",
        error.message
      );
      return;
    }

    setStaff((data as StaffProfile[]) ?? []);
  }, [clinicId]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    if (showExistingAccounts) {
      loadAllAccounts();
    }
  }, [
    showExistingAccounts,
    loadAllAccounts,
  ]);

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
      staff.find(
        (item) => item.id === targetId
      ) ??
      allAccounts.find(
        (item) => item.id === targetId
      );

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
              const {
                error: therapistError,
              } = await supabase
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
              const {
                error: therapistDeleteError,
              } = await supabase
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
            setEditingRoleId(null);

            await loadStaff();
            await loadAllAccounts();

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
          <Text
            style={{
              color: COLORS.inkMid,
            }}
          >
            Your account is not currently assigned
            to a clinic.
          </Text>
        </Card>

        <SecondaryButton
          title="Back"
          onPress={() => router.back()}
        />
      </Screen>
    );
  }

  const renderAccountCard = (
    account: StaffProfile
  ) => {
    const isEditing =
      editingRoleId === account.id;

    const isBusy =
      busyId === account.id;

    return (
      <Card key={account.id}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flex: 1,
              paddingRight: 10,
            }}
          >
            <Text
              style={{
                fontFamily: "Georgia",
                fontSize: 16,
                color: COLORS.ink,
                marginBottom: 3,
              }}
            >
              {account.full_name ?? "Unnamed"}
            </Text>

            <Text
              style={{
                color: COLORS.inkMid,
                fontSize: 12,
                marginBottom: 7,
              }}
            >
              {account.email ?? "No email"}
            </Text>

            {/* Small role bubble */}
            <Pill text={account.role} />
          </View>

          {/* Edit role icon */}
          <EditRoleButton
            onPress={() =>
              setEditingRoleId(
                isEditing
                  ? null
                  : account.id
              )
            }
            disabled={isBusy}
          />
        </View>

        {isEditing ? (
          <View
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
            }}
          >
            <Text
              style={{
                color: COLORS.inkMid,
                fontSize: 12,
                marginBottom: 7,
              }}
            >
              Change role
            </Text>

            <RoleActionRow
              target={account}
              onSetRole={handleSetRole}
              busy={isBusy}
            />
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 34,
        }}
      >
        <Eyebrow>
          Clinic workspace
        </Eyebrow>

        <Heading>
          Manage Staff
        </Heading>

        <Text
          style={{
            color: COLORS.inkMid,
            lineHeight: 19,
            marginBottom: 12,
          }}
        >
          Add a new therapist or manage an existing
          account in your clinic.
        </Text>

        <PrimaryButton
          title="+ Add Therapist"
          onPress={() => {
            setShowAddTherapist(
              !showAddTherapist
            );
            setShowExistingAccounts(false);
            setEditingRoleId(null);
          }}
        />

        <View style={{ height: 10 }} />

        <SecondaryButton
          title="Existing Account"
          onPress={() => {
            setShowExistingAccounts(
              !showExistingAccounts
            );
            setShowAddTherapist(false);
            setEditingRoleId(null);
          }}
        />

        {showAddTherapist ? (
          <Card>
            <Eyebrow>
              New therapist
            </Eyebrow>

            <Label>
              Full name
            </Label>

            <FieldInput
              value={newTherapist.full_name}
              onChangeText={(v) =>
                setNewTherapist({
                  ...newTherapist,
                  full_name: v,
                })
              }
              placeholder="Therapist name"
            />

            <Label>
              Email
            </Label>

            <FieldInput
              value={newTherapist.email}
              onChangeText={(v) =>
                setNewTherapist({
                  ...newTherapist,
                  email: v,
                })
              }
              placeholder="therapist@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Label>
              Password
            </Label>

            <FieldInput
              value={newTherapist.password}
              onChangeText={(v) =>
                setNewTherapist({
                  ...newTherapist,
                  password: v,
                })
              }
              placeholder="Create password"
              secureTextEntry
            />

            <Label>
              Confirm password
            </Label>

            <FieldInput
              value={
                newTherapist.confirmPassword
              }
              onChangeText={(v) =>
                setNewTherapist({
                  ...newTherapist,
                  confirmPassword: v,
                })
              }
              placeholder="Confirm password"
              secureTextEntry
            />

            <PrimaryButton
              title="Create Therapist"
              loading={
                creatingTherapist
              }
              onPress={async () => {
                if (
                  !newTherapist.full_name.trim() ||
                  !newTherapist.email.trim() ||
                  !newTherapist.password
                ) {
                  Alert.alert(
                    "Missing information",
                    "Please complete all fields."
                  );

                  return;
                }

                if (
                  newTherapist.password.length <
                    6 ||
                  newTherapist.password !==
                    newTherapist.confirmPassword
                ) {
                  Alert.alert(
                    "Invalid password",
                    "Use at least 6 characters and make sure both passwords match."
                  );

                  return;
                }

                setCreatingTherapist(
                  true
                );

                const {
                  data,
                  error,
                } =
                  await supabase.functions.invoke(
                    "create-therapist",
                    {
                      body: {
                        full_name:
                          newTherapist.full_name.trim(),

                        email:
                          newTherapist.email
                            .trim()
                            .toLowerCase(),

                        password:
                          newTherapist.password,

                        clinic_id:
                          clinicId,
                      },
                    }
                  );

                setCreatingTherapist(
                  false
                );

                if (
                  error ||
                  data?.error
                ) {
                  Alert.alert(
                    "Couldn't create therapist",
                    error?.message ??
                      data?.error
                  );

                  return;
                }

                setNewTherapist({
                  full_name: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                });

                setShowAddTherapist(
                  false
                );

                await loadStaff();
                await loadAllAccounts();

                Alert.alert(
                  "Therapist created",
                  "The therapist account was created successfully."
                );
              }}
            />
          </Card>
        ) : null}

        {showExistingAccounts ? (
          <Card>
            <Eyebrow>
              Existing accounts
            </Eyebrow>

            <TextInput
              value={accountSearch}
              onChangeText={
                setAccountSearch
              }
              placeholder="Search by name or email"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor:
                  COLORS.border,
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
                color: COLORS.ink,
              }}
            />

            {allAccounts
              .filter((account) => {
                const q =
                  accountSearch
                    .trim()
                    .toLowerCase();

                return (
                  !q ||
                  account.full_name
                    ?.toLowerCase()
                    .includes(q) ||
                  account.email
                    ?.toLowerCase()
                    .includes(q)
                );
              })
              .map(
                renderAccountCard
              )}
          </Card>
        ) : null}

        <View
          style={{
            marginTop: 16,
            marginBottom: 4,
          }}
        >
          <Eyebrow>
            Current staff
          </Eyebrow>
        </View>

        {staff.length === 0 ? (
          <Card>
            <Text
              style={{
                color:
                  COLORS.inkMid,
              }}
            >
              No admins, owners, or
              therapists on file yet.
            </Text>
          </Card>
        ) : (
          staff.map(
            renderAccountCard
          )
        )}

        <View
          style={{ height: 4 }}
        />

        <SecondaryButton
          title="Back"
          onPress={() =>
            router.back()
          }
        />
      </ScrollView>
    </Screen>
  );
}