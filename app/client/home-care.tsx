import React, { useEffect, useState } from "react";
import { FlatList, Text } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { getHomeCareForClient } from "@/services/clientRecords";
import { Heading, Card, COLORS } from "@/components/ui";
import type { HomeCareRecommendation } from "@/types/database.types";

export default function HomeCare() {
  const { profile } = useAuth();
  const [items, setItems] = useState<HomeCareRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    getHomeCareForClient(profile.id).then(({ data }) => {
      setItems(data ?? []);
      setLoading(false);
    });
  }, [profile]);

  return (
    <FlatList
      style={{ backgroundColor: COLORS.cream }}
      contentContainerStyle={{ padding: 20, flexGrow: 1 }}
      ListHeaderComponent={<Heading>Home care recommendations</Heading>}
      data={items}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        !loading ? (
          <Text style={{ color: COLORS.inkMid }}>Nothing here yet — check back after your next session.</Text>
        ) : null
      }
      renderItem={({ item }) => (
        <Card>
          <Text style={{ color: COLORS.ink }}>{item.instructions}</Text>
          <Text style={{ color: COLORS.inkMid, fontSize: 11, marginTop: 6 }}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </Card>
      )}
    />
  );
}
