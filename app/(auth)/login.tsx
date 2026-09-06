import React, { useState } from "react";
import { Text, View } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Screen, Heading, Label, FieldInput, PrimaryButton, COLORS } from "@/components/ui";

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
      <Heading>Welcome back</Heading>

      <Label>Email</Label>
      <FieldInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
      />

      <Label>Password</Label>
      <FieldInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />

      {error && <Text style={{ color: "#B3261E", marginBottom: 10 }}>{error}</Text>}

      <PrimaryButton title="Log in" onPress={handleLogin} loading={loading} />

      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 18, gap: 6 }}>
        <Text style={{ color: COLORS.inkMid }}>New here?</Text>
        <Link href="/(auth)/register" style={{ color: COLORS.sageDeep, fontWeight: "600" }}>
          Create an account
        </Link>
      </View>
      <Link
        href="/(auth)/forgot-password"
        style={{ color: COLORS.inkMid, textAlign: "center", marginTop: 10 }}
      >
        Forgot password?
      </Link>
    </Screen>
  );
}
