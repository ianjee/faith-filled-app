import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Screen, Eyebrow, Heading, Card, SecondaryButton, COLORS } from "@/components/ui";

interface HomeCareItem {
  id: string;
  instructions: string;
  created_at: string;
}

export default function HomeCare() {
  const { profile } = useAuth();
  const [items, setItems] = useState<HomeCareItem[]>([]);

  useEffect(() => {
    if (!profile) return;
    // Table: home_care_recommendations — RLS "homecare_client" scopes to client_id = auth.uid()
    supabase
      .from("home_care_recommendations")
      .select("*")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as HomeCareItem[]) ?? []));
  }, [profile?.id]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
        <Eyebrow>From your therapist</Eyebrow>
        <Heading>Home Care Recommendations</Heading>

        {items.length === 0 ? (
          <Card>
            <Text style={{ color: COLORS.inkMid, lineHeight: 19 }}>
              Nothing here yet — your therapist will add recommendations after your next session.
            </Text>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <Text style={{ color: COLORS.inkMid, lineHeight: 19, marginBottom: 6 }}>{item.instructions}</Text>
              <Text style={{ fontSize: 11, color: COLORS.inkMid }}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </Card>
          ))
        )}

        <View style={{ height: 4 }} />
        <SecondaryButton title="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
