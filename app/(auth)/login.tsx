import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Screen, BrandMark, Eyebrow, Heading, Subheading, Label, FieldInput, PrimaryButton, COLORS } from "@/components/ui";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    router.replace("/");
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <BrandMark />
        <Eyebrow>Private Wellness Portal</Eyebrow>
        <Heading>Welcome back</Heading>
        <Subheading>Sign in to continue your Faith-Filled Bodywork experience.</Subheading>

        <View style={{ marginTop: 4 }}>
          <Label>Email address</Label>
          <FieldInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            placeholder="you@example.com"
          />

          <Label>Password</Label>
          <FieldInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter your password"
          />
        </View>

        {error && (
          <View style={{ backgroundColor: "#F8E9E6", borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <Text style={{ color: COLORS.danger, fontSize: 13, lineHeight: 18 }}>{error}</Text>
          </View>
        )}

        <PrimaryButton title="Sign in" onPress={handleLogin} loading={loading} />

        <Link href="/(auth)/forgot-password" style={{ color: COLORS.sageDeep, textAlign: "center", marginTop: 18, fontWeight: "600" }}>
          Forgot password?
        </Link>

        <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 25 }} />

        <View style={{ flexDirection: "row", justifyContent: "center", gap: 5 }}>
          <Text style={{ color: COLORS.inkMid }}>New here?</Text>
          <Link href="/(auth)/register" style={{ color: COLORS.gold, fontWeight: "700" }}>
            Create an account
          </Link>
        </View>
      </ScrollView>
    </Screen>
  );
}
