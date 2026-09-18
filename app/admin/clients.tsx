import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Screen, Eyebrow, Heading, Card, SecondaryButton, COLORS } from "@/components/ui";

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
        supabase.from("clients").select("id").eq("clinic_id", clinicId),
        supabase.from("therapists").select("id").eq("clinic_id", clinicId),
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
        ? supabase.from("profiles").select("id, full_name, role, clinic_id").in("id", clientIds).eq("role", "client").eq("clinic_id", clinicId)
        : Promise.resolve({ data: [], error: null }),
      therapistIds.length
        ? supabase.from("profiles").select("id, full_name, role, clinic_id").in("id", therapistIds).eq("role", "therapist").eq("clinic_id", clinicId)
        : Promise.resolve({ data: [], error: null }),
      clientIds.length
        ? supabase.from("client_therapist_assignments").select("client_id, therapist_id").in("client_id", clientIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (clientProfilesResult.error) console.warn("Failed to load client profiles:", clientProfilesResult.error.message);
    if (therapistProfilesResult.error) console.warn("Failed to load therapist profiles:", therapistProfilesResult.error.message);
    if (assignmentsResult.error) console.warn("Failed to load therapist assignments:", assignmentsResult.error.message);

    const validClientProfiles = clientProfilesResult.data ?? [];
    const validClientIds = new Set(validClientProfiles.map((item) => item.id));

    setTherapists(
      (therapistProfilesResult.data ?? []).map((item) => ({
        id: item.id,
        full_name: item.full_name,
      }))
    );

    const assignedByClient = new Map<string, string[]>();

    for (const assignment of assignmentsResult.data ?? []) {
      if (!validClientIds.has(assignment.client_id)) continue;
      assignedByClient.set(assignment.client_id, [
        ...(assignedByClient.get(assignment.client_id) ?? []),
        assignment.therapist_id,
      ]);
    }

    setClients(
      validClientProfiles.map((item) => ({
        id: item.id,
        full_name: item.full_name,
        therapist_ids: assignedByClient.get(item.id) ?? [],
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

    if (alreadyAssigned) {
      const { error } = await supabase.from("client_therapist_assignments").delete()
        .eq("client_id", clientId).eq("therapist_id", therapistId);

      if (error) {
        setSavingId(null);
        Alert.alert("Assignment failed", error.message);
        return;
      }

      setClients((current) =>
        current.map((item) =>
          item.id === clientId
            ? { ...item, therapist_ids: item.therapist_ids.filter((id) => id !== therapistId) }
            : item
        )
      );
      setSavingId(null);
      return;
    }

    if (client.therapist_ids.length > 0) {
      const { error } = await supabase.from("client_therapist_assignments").delete().eq("client_id", clientId);

      if (error) {
        setSavingId(null);
        Alert.alert("Change failed", error.message);
        return;
      }
    }

    const { error } = await supabase.from("client_therapist_assignments").insert({
      client_id: clientId,
      therapist_id: therapistId,
    });

    if (error) {
      setSavingId(null);
      Alert.alert("Assignment failed", error.message);
      return;
    }

    setClients((current) =>
      current.map((item) =>
        item.id === clientId ? { ...item, therapist_ids: [therapistId] } : item
      )
    );

    setOpenClientId(null);
    setSavingId(null);
  }

  function therapistName(therapistId: string) {
    return therapists.find((therapist) => therapist.id === therapistId)?.full_name ?? "Therapist";
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Eyebrow>Clinic workspace</Eyebrow>
        <Heading>Clients</Heading>

        {loading ? (
          <View>
            {[1, 2, 3].map((item) => (
              <Card key={item}>
                <View style={styles.skeletonHeader}>
                  <View style={{ flex: 1, gap: 7 }}>
                    <View style={styles.skeletonSmall} />
                    <View style={styles.skeletonName} />
                    <View style={styles.skeletonText} />
                  </View>
                  <View style={styles.skeletonIcon} />
                </View>
              </Card>
            ))}
          </View>
        ) : clients.length === 0 ? (
          <Card>
            <Text style={styles.muted}>No clients on file yet.</Text>
          </Card>
        ) : (
          clients.map((client) => {
            const isOpen = openClientId === client.id;
            const hasTherapist = client.therapist_ids.length > 0;

            return (
              <Card key={client.id}>
                <View style={styles.clientHeader}>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>
                      {(client.full_name ?? "Client").toUpperCase()}
                    </Text>

                    <Text style={styles.therapistLabel}>THERAPIST</Text>

                    {hasTherapist ? (
                      <View style={styles.therapistRow}>
                        <Text style={styles.assignedName}>
                          {therapistName(client.therapist_ids[0])}
                        </Text>
                        <Pressable
                          onPress={() => setOpenClientId(isOpen ? null : client.id)}
                          disabled={savingId === client.id}
                        >
                          <Text style={styles.changeText}>{isOpen ? "Close" : "Change"}</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Text style={styles.muted}>No therapist assigned</Text>
                    )}
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View records for ${client.full_name ?? "client"}`}
                    onPress={() =>
                      router.push({
                        pathname: "/admin/client-details",
                        params: { clientId: client.id },
                      })
                    }
                    style={({ pressed }) => [styles.recordsButton, pressed && styles.pressed]}
                  >
                    <View style={styles.recordsIcon}>
                      <View style={styles.iconHead} />
                      <View style={styles.iconBody} />
                    </View>
                  </Pressable>
                </View>

                {!hasTherapist ? (
                  <>
                    <View style={{ height: 10 }} />
                    <SecondaryButton
                      title={isOpen ? "Close therapist list" : "Assign Therapist"}
                      onPress={() => setOpenClientId(isOpen ? null : client.id)}
                    />
                  </>
                ) : null}

                {isOpen ? (
                  <View style={styles.therapistList}>
                    {therapists.length === 0 ? (
                      <Text style={styles.muted}>No therapists are available for this clinic.</Text>
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
                              {selected ? "Current" : "Change"}
                            </Text>
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                ) : null}
              </Card>
            );
          })
        )}

        {!loading && <SecondaryButton title="Back" onPress={() => router.back()} />}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 34, paddingTop: 30 },
  skeletonHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skeletonSmall: { width: 48, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  skeletonName: { width: "65%", height: 18, borderRadius: 5, backgroundColor: COLORS.border },
  skeletonText: { width: "35%", height: 10, borderRadius: 5, backgroundColor: COLORS.border },
  skeletonIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.border },
  clientHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  clientInfo: { flex: 1, paddingRight: 10 },
  clientName: { fontFamily: "Georgia", fontSize: 19, fontWeight: "700", letterSpacing: 0.5, color: COLORS.ink, marginBottom: 9 },
  therapistLabel: { color: COLORS.inkMid, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 3 },
  therapistRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  assignedName: { color: COLORS.sageDeep, fontSize: 14, fontWeight: "600" },
  changeText: { color: COLORS.gold, fontSize: 12, fontWeight: "700" },
  recordsButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white },
  recordsIcon: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  iconHead: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.inkMid, marginBottom: 2 },
  iconBody: { width: 14, height: 7, borderTopLeftRadius: 7, borderTopRightRadius: 7, backgroundColor: COLORS.inkMid },
  therapistList: { marginTop: 10, gap: 8 },
  therapistOption: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.white },
  selectedOption: { borderColor: COLORS.sageDeep },
  optionName: { color: COLORS.ink, fontWeight: "600" },
  optionAction: { color: COLORS.sageDeep, fontSize: 12, fontWeight: "700" },
  muted: { color: COLORS.inkMid, fontSize: 12 },
  pressed: { opacity: 0.65 },
});
