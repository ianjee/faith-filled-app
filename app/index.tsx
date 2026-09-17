import React from "react";
import {
  ActivityIndicator,
  View,
} from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { HOME_ROUTE_BY_ROLE } from "@/constants/roles";
import { COLORS } from "@/components/ui";

export default function Index() {
  const {
    session,
    profile,
    loading,
    appLocked,
  } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator
          color={COLORS.sageDeep}
        />
      </View>
    );
  }

  if (!session || !profile) {
    return <Redirect href="/(auth)/login" />;
  }

  if (appLocked) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Redirect
      href={HOME_ROUTE_BY_ROLE[profile.role] as any}
    />
  );
}
