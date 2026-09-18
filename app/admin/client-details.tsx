import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import {
  Screen,
  Eyebrow,
  Heading,
  Card,
  SecondaryButton,
  COLORS,
} from "@/components/ui";

type ClientProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

type ClientRecord = {
  id: string;
  date_of_birth: string | null;
  emergency_contact: string | null;
};

type IntakeRecord = {
  id: string;
  responses: Record<string, unknown>;
  submitted_at: string | null;
  created_at: string;
};

type HealthRecord = {
  id: string;
  conditions: string[] | null;
  medications: string[] | null;
  notes: string | null;
  updated_at: string;
};

type ConsentRecord = {
  id: string;
  document_name: string;
  document_version: string;
  agreed: boolean;
  agreed_at: string | null;
  created_at: string;
};

type AppointmentRecord = {
  id: string;
  service_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
};

type SoapRecord = {
  id: string;
  appointment_id: string;
  subjective: string | null;
  pain_before: number | null;
  objective: string | null;
  range_of_motion: string | null;
  assessment: string | null;
  plan_next_treatment: string | null;
  plan_home_care: string | null;
  signed_at: string | null;
};

type GoalRecord = {
  id: string;
  goal: string;
  target_date: string | null;
  achieved: boolean;
};

type HomeCareRecord = {
  id: string;
  instructions: string;
  created_at: string;
};

type SurveyRecord = {
  id: string;
  appointment_id: string;
  pain_before: number | null;
  pain_after: number | null;
  sleep_improved: boolean | null;
  stress_improved: boolean | null;
  mobility_improved: boolean | null;
  communication_rating: number | null;
  understood_home_care: boolean | null;
  would_recommend: boolean | null;
  feedback_text: string | null;
  created_at: string;
};

type PhotoRecord = {
  id: string;
  session_id: string | null;
  storage_path: string;
  consent_id: string | null;
  created_at: string;
};

export default function AdminClientDetails() {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [intake, setIntake] = useState<IntakeRecord[]>([]);
  const [health, setHealth] = useState<HealthRecord[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [soapNotes, setSoapNotes] = useState<SoapRecord[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [homeCare, setHomeCare] = useState<HomeCareRecord[]>([]);
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    const id = clientId;

    async function loadClient() {
      setLoading(true);

      const [
        profileResult,
        clientResult,
        intakeResult,
        healthResult,
        consentResult,
        appointmentResult,
        goalResult,
        homeCareResult,
        surveyResult,
        photoResult,
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone").eq("id", id).single(),

        supabase
          .from("clients")
          .select("id, date_of_birth, emergency_contact")
          .eq("id", id)
          .single(),

        supabase
          .from("intake_forms")
          .select("id, responses, submitted_at, created_at")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),

        supabase
          .from("health_histories")
          .select("id, conditions, medications, notes, updated_at")
          .eq("client_id", id)
          .order("updated_at", { ascending: false }),

        supabase
          .from("consents")
          .select("id, document_name, document_version, agreed, agreed_at, created_at")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),

        supabase
          .from("appointments")
          .select("id, service_name, starts_at, ends_at, status")
          .eq("client_id", id)
          .order("starts_at", { ascending: false }),

        supabase
          .from("treatment_goals")
          .select("id, goal, target_date, achieved")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),

        supabase
          .from("home_care_recommendations")
          .select("id, instructions, created_at")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),

        supabase
          .from("surveys")
          .select("id, appointment_id, pain_before, pain_after, sleep_improved, stress_improved, mobility_improved, communication_rating, understood_home_care, would_recommend, feedback_text, created_at")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),

        supabase
          .from("photos")
          .select("id, session_id, storage_path, consent_id, created_at")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data as ClientProfile);
      }

      if (clientResult.data) {
        setClient(clientResult.data as ClientRecord);
      }

      setIntake((intakeResult.data ?? []) as IntakeRecord[]);
      setHealth((healthResult.data ?? []) as HealthRecord[]);
      setConsents((consentResult.data ?? []) as ConsentRecord[]);
      setAppointments((appointmentResult.data ?? []) as AppointmentRecord[]);
      setGoals((goalResult.data ?? []) as GoalRecord[]);
      setHomeCare((homeCareResult.data ?? []) as HomeCareRecord[]);
      setSurveys((surveyResult.data ?? []) as SurveyRecord[]);
      setPhotos((photoResult.data ?? []) as PhotoRecord[]);

      if (appointmentResult.data?.length) {
        const appointmentIds = appointmentResult.data.map(
          (appointment) => appointment.id
        );

        const { data: soapData } = await supabase
          .from("soap_notes")
          .select("id, appointment_id, subjective, pain_before, objective, range_of_motion, assessment, plan_next_treatment, plan_home_care, signed_at")
          .in("appointment_id", appointmentIds)
          .order("created_at", { ascending: false });

        setSoapNotes((soapData ?? []) as SoapRecord[]);
      } else {
        setSoapNotes([]);
      }

      setLoading(false);
    }

    loadClient();
  }, [clientId]);

  if (!clientId) {
    return (
      <Screen>
        <Eyebrow>Client records</Eyebrow>
        <Heading>No client selected</Heading>
        <SecondaryButton title="Back" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Eyebrow>Clinic workspace</Eyebrow>
        <Heading>{profile?.full_name ?? "Client Details"}</Heading>

        {loading ? (
          <Card>
            <Text style={styles.muted}>Loading client records...</Text>
          </Card>
        ) : (
          <>
            <Card>
              <SectionTitle title="Client Information" />
              <Info label="Name" value={profile?.full_name} />
              <Info label="Phone" value={profile?.phone} />
              <Info label="Date of birth" value={client?.date_of_birth} />
              <Info label="Emergency contact" value={client?.emergency_contact} />
            </Card>

            <Card>
              <SectionTitle title="Intake Forms" />
              {intake.length === 0 ? (
                <Empty />
              ) : (
                intake.map((record) => (
                  <Record key={record.id}>
                    <Text style={styles.recordTitle}>Intake Form</Text>
                    <Text style={styles.recordText}>
                      {record.submitted_at
                        ? `Submitted: ${formatDate(record.submitted_at)}`
                        : "Not submitted"}
                    </Text>
                    <Text style={styles.recordText}>
                      Responses: {JSON.stringify(record.responses)}
                    </Text>
                  </Record>
                ))
              )}
            </Card>

            <Card>
              <SectionTitle title="Health History" />
              {health.length === 0 ? (
                <Empty />
              ) : (
                health.map((record) => (
                  <Record key={record.id}>
                    <Info label="Conditions" value={record.conditions?.join(", ") || "None recorded"} />
                    <Info label="Medications" value={record.medications?.join(", ") || "None recorded"} />
                    <Info label="Notes" value={record.notes} />
                    <Text style={styles.recordText}>
                      Updated: {formatDate(record.updated_at)}
                    </Text>
                  </Record>
                ))
              )}
            </Card>

            <Card>
              <SectionTitle title="Consent & Policies" />
              {consents.length === 0 ? (
                <Empty />
              ) : (
                consents.map((record) => (
                  <Record key={record.id}>
                    <Text style={styles.recordTitle}>{record.document_name}</Text>
                    <Text style={styles.recordText}>Version: {record.document_version}</Text>
                    <Text style={styles.recordText}>
                      Status: {record.agreed ? "Agreed" : "Not agreed"}
                    </Text>
                    {record.agreed_at && (
                      <Text style={styles.recordText}>
                        Agreed: {formatDate(record.agreed_at)}
                      </Text>
                    )}
                  </Record>
                ))
              )}
            </Card>

            <Card>
              <SectionTitle title="Appointments" />
              {appointments.length === 0 ? (
                <Empty />
              ) : (
                appointments.map((record) => (
                  <Record key={record.id}>
                    <Text style={styles.recordTitle}>{record.service_name}</Text>
                    <Text style={styles.recordText}>{formatDate(record.starts_at)}</Text>
                    <Text style={styles.recordText}>Status: {record.status}</Text>
                  </Record>
                ))
              )}
            </Card>

            <Card>
              <SectionTitle title="SOAP / Session Notes" />
              {soapNotes.length === 0 ? (
                <Empty />
              ) : (
                soapNotes.map((record) => (
                  <Record key={record.id}>
                    <Info
                      label="Pain before"
                      value={record.pain_before !== null ? `${record.pain_before}/10` : null}
                    />
                    <Info label="Subjective" value={record.subjective} />
                    <Info label="Objective" value={record.objective} />
                    <Info label="Range of motion" value={record.range_of_motion} />
                    <Info label="Assessment" value={record.assessment} />
                    <Info label="Next treatment" value={record.plan_next_treatment} />
                    <Info label="Home care plan" value={record.plan_home_care} />
                    <Info
                      label="Signed"
                      value={record.signed_at ? formatDate(record.signed_at) : "Not signed"}
                    />
                  </Record>
                ))
              )}
            </Card>

            <Card>
              <SectionTitle title="Treatment Goals" />
              {goals.length === 0 ? (
                <Empty />
              ) : (
                goals.map((record) => (
                  <Record key={record.id}>
                    <Text style={styles.recordTitle}>{record.goal}</Text>
                    <Text style={styles.recordText}>
                      Status: {record.achieved ? "Achieved" : "In progress"}
                    </Text>
                    {record.target_date && (
                      <Text style={styles.recordText}>
                        Target: {record.target_date}
                      </Text>
                    )}
                  </Record>
                ))
              )}
            </Card>

            <Card>
              <SectionTitle title="Home Care" />
              {homeCare.length === 0 ? (
                <Empty />
              ) : (
                homeCare.map((record) => (
                  <Record key={record.id}>
                    <Text style={styles.recordText}>{record.instructions}</Text>
                    <Text style={styles.recordText}>
                      Added: {formatDate(record.created_at)}
                    </Text>
                  </Record>
                ))
              )}
            </Card>

            <Card>
              <SectionTitle title="Session Surveys" />
              {surveys.length === 0 ? (
                <Empty />
              ) : (
                surveys.map((record) => (
                  <Record key={record.id}>
                    <Info
                      label="Pain before"
                      value={record.pain_before !== null ? `${record.pain_before}/10` : null}
                    />
                    <Info
                      label="Pain after"
                      value={record.pain_after !== null ? `${record.pain_after}/10` : null}
                    />
                    <Info label="Sleep improved" value={yesNo(record.sleep_improved)} />
                    <Info label="Stress improved" value={yesNo(record.stress_improved)} />
                    <Info label="Mobility improved" value={yesNo(record.mobility_improved)} />
                    <Info
                      label="Communication"
                      value={
                        record.communication_rating !== null
                          ? `${record.communication_rating}/5`
                          : null
                      }
                    />
                    <Info label="Understood home care" value={yesNo(record.understood_home_care)} />
                    <Info label="Would recommend" value={yesNo(record.would_recommend)} />
                    <Info label="Feedback" value={record.feedback_text} />
                  </Record>
                ))
              )}
            </Card>

            <Card>
              <SectionTitle title="Photos / Progress Records" />
              {photos.length === 0 ? (
                <Empty />
              ) : (
                photos.map((record) => (
                  <Record key={record.id}>
                    <Text style={styles.recordText}>
                      Storage path: {record.storage_path}
                    </Text>
                    <Text style={styles.recordText}>
                      Added: {formatDate(record.created_at)}
                    </Text>
                  </Record>
                ))
              )}
            </Card>
          </>
        )}

        <SecondaryButton title="Back to Clients" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function Record({ children }: { children: React.ReactNode }) {
  return <View style={styles.record}>{children}</View>;
}

function Empty() {
  return <Text style={styles.muted}>No records available.</Text>;
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "Not recorded"}</Text>
    </>
  );
}

function yesNo(value: boolean | null) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not answered";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 34,
  },
  sectionTitle: {
    fontFamily: "Georgia",
    fontSize: 19,
    color: COLORS.ink,
    marginBottom: 16,
  },
  record: {
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.ink,
    marginBottom: 6,
  },
  recordText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.inkMid,
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: COLORS.sageDeep,
    marginTop: 8,
    marginBottom: 3,
  },
  value: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.ink,
    marginBottom: 7,
  },
  muted: {
    color: COLORS.inkMid,
    lineHeight: 20,
  },
});