import React, { useEffect, useState } from "react";
import { ScrollView, Text, Pressable, StyleSheet, View, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  Screen,
  Eyebrow,
  Heading,
  Card,
  SecondaryButton,
  PrimaryButton,
  COLORS,
} from "@/components/ui";

interface ClientRow {
  id: string;
  full_name: string | null;
  therapist_ids: string[];
}

interface TherapistRow {
  id: string;
  full_name: string | null;
}

export default function AdminClients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [therapists, setTherapists] = useState<TherapistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openClientId, setOpenClientId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.clinic_id) {
      setClients([]);
      setTherapists([]);
      setLoading(false);
      return;
    }

    loadData(profile.clinic_id);
  }, [profile?.clinic_id]);

  async function loadData(clinicId: string) {
    setLoading(true);

    const [{ data: clientRows, error: clientError }, { data: therapistRows, error: therapistError }] =
      await Promise.all([
        supabase
          .from("clients")
          .select("id")
          .eq("clinic_id", clinicId),
        supabase
          .from("therapists")
          .select("id")
          .eq("clinic_id", clinicId),
      ]);

    if (clientError) {
      console.warn("Failed to load clients:", clientError.message);
      setClients([]);
      setLoading(false);
      return;
    }

    if (therapistError) {
      console.warn("Failed to load therapists:", therapistError.message);
      setTherapists([]);
    }

    const clientIds = (clientRows ?? []).map((row) => row.id);
    const therapistIds = (therapistRows ?? []).map((row) => row.id);

    const [clientProfilesResult, therapistProfilesResult, assignmentsResult] = await Promise.all([
      clientIds.length
        ? supabase.from("profiles").select("id, full_name").in("id", clientIds)
        : Promise.resolve({ data: [], error: null }),
      therapistIds.length
        ? supabase.from("profiles").select("id, full_name").in("id", therapistIds)
        : Promise.resolve({ data: [], error: null }),
      clientIds.length
        ? supabase
            .from("client_therapist_assignments")
            .select("client_id, therapist_id")
            .in("client_id", clientIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (clientProfilesResult.error) {
      console.warn("Failed to load client profiles:", clientProfilesResult.error.message);
    }

    if (therapistProfilesResult.error) {
      console.warn("Failed to load therapist profiles:", therapistProfilesResult.error.message);
    }

    if (assignmentsResult.error) {
      console.warn("Failed to load therapist assignments:", assignmentsResult.error.message);
    }

    const clientNameById = new Map(
      (clientProfilesResult.data ?? []).map((p) => [p.id, p.full_name])
    );

    const therapistList: TherapistRow[] = (therapistProfilesResult.data ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
    }));

    const assignedByClient = new Map<string, string[]>();
    for (const assignment of assignmentsResult.data ?? []) {
      const existing = assignedByClient.get(assignment.client_id) ?? [];
      existing.push(assignment.therapist_id);
      assignedByClient.set(assignment.client_id, existing);
    }

    setTherapists(therapistList);
    setClients(
      clientIds.map((id) => ({
        id,
        full_name: clientNameById.get(id) ?? null,
        therapist_ids: assignedByClient.get(id) ?? [],
      }))
    );
    setLoading(false);
  }

  async function toggleAssignment(clientId: string, therapistId: string) {
    if (!profile?.clinic_id || savingId) return;

    const client = clients.find((item) => item.id === clientId);
    if (!client) return;

    const alreadyAssigned = client.therapist_ids.includes(therapistId);
    setSavingId(clientId);

    const result = alreadyAssigned
      ? await supabase
          .from("client_therapist_assignments")
          .delete()
          .eq("client_id", clientId)
          .eq("therapist_id", therapistId)
      : await supabase
          .from("client_therapist_assignments")
          .insert({ client_id: clientId, therapist_id: therapistId });

    if (result.error) {
      setSavingId(null);
      Alert.alert(
        "Assignment failed",
        result.error.message
      );
      return;
    }

    setClients((current) =>
      current.map((item) => {
        if (item.id !== clientId) return item;
        return {
          ...item,
          therapist_ids: alreadyAssigned
            ? item.therapist_ids.filter((id) => id !== therapistId)
            : [...item.therapist_ids, therapistId],
        };
      })
    );

    setSavingId(null);
  }

  function therapistName(therapistId: string) {
    return (
      therapists.find((therapist) => therapist.id === therapistId)?.full_name ??
      "Therapist"
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Eyebrow>Clinic workspace</Eyebrow>
        <Heading>Clients</Heading>

        {loading ? (
          <Card>
            <Text style={styles.muted}>Loading clients...</Text>
          </Card>
        ) : clients.length === 0 ? (
          <Card>
            <Text style={styles.muted}>No clients on file yet.</Text>
          </Card>
        ) : (
          clients.map((client) => {
            const isOpen = openClientId === client.id;

            return (
              <Card key={client.id}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/admin/client-details",
                      params: { clientId: client.id },
                    })
                  }
                >
                  <Text style={styles.clientName}>
                    {client.full_name ?? "Client"}
                  </Text>
                  <Text style={styles.viewText}>View client records →</Text>
                </Pressable>

                <View style={styles.assignmentBox}>
                  <Text style={styles.assignmentTitle}>Assigned Therapist(s)</Text>

                  {client.therapist_ids.length === 0 ? (
                    <Text style={styles.muted}>No therapist assigned</Text>
                  ) : (
                    client.therapist_ids.map((id) => (
                      <Text key={id} style={styles.assignedName}>
                        • {therapistName(id)}
                      </Text>
                    ))
                  )}

                  <View style={{ height: 9 }} />
                  <SecondaryButton
                    title={isOpen ? "Close therapist list" : "Assign Therapist"}
                    onPress={() => setOpenClientId(isOpen ? null : client.id)}
                  />

                  {isOpen ? (
                    <View style={styles.therapistList}>
                      {therapists.length === 0 ? (
                        <Text style={styles.muted}>
                          No therapists are available for this clinic.
                        </Text>
                      ) : (
                        therapists.map((therapist) => {
                          const selected = client.therapist_ids.includes(therapist.id);
                          return (
                            <Pressable
                              key={therapist.id}
                              disabled={savingId === client.id}
                              onPress={() => toggleAssignment(client.id, therapist.id)}
                              style={({ pressed }) => [
                                styles.therapistOption,
                                selected && styles.selectedOption,
                                pressed && styles.pressed,
                              ]}
                            >
                              <Text style={styles.optionName}>
                                {selected ? "✓ " : ""}
                                {therapist.full_name ?? "Therapist"}
                              </Text>
                              <Text style={styles.optionAction}>
                                {selected ? "Remove" : "Assign"}
                              </Text>
                            </Pressable>
                          );
                        })
                      )}
                    </View>
                  ) : null}
                </View>
              </Card>
            );
          })
        )}

        <SecondaryButton title="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 34,
  },
  clientName: {
    fontFamily: "Georgia",
    fontSize: 18,
    color: COLORS.ink,
    marginBottom: 6,
  },
  viewText: {
    fontSize: 13,
    color: COLORS.sageDeep,
    fontWeight: "600",
  },
  assignmentBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  assignmentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.ink,
    marginBottom: 7,
  },
  assignedName: {
    color: COLORS.inkMid,
    fontSize: 13,
    marginBottom: 3,
  },
  therapistList: {
    marginTop: 10,
    gap: 8,
  },
  therapistOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  selectedOption: {
    borderColor: COLORS.sageDeep,
  },
  optionName: {
    color: COLORS.ink,
    fontWeight: "600",
  },
  optionAction: {
    color: COLORS.sageDeep,
    fontSize: 12,
    fontWeight: "700",
  },
  muted: {
    color: COLORS.inkMid,
  },
  pressed: {
    opacity: 0.7,
  },
});
