import React, { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Screen, Heading, Label, FieldInput, PrimaryButton } from "@/components/ui";

export default function Register() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    // New accounts default to the "client" role (see AuthContext.signUp).
    // A clinic admin assigns clinic_id and elevates role for staff accounts.
    router.replace("/(auth)/login");
  };

  return (
    <Screen>
      <Heading>Create your account</Heading>

      <Label>Full name</Label>
      <FieldInput value={fullName} onChangeText={setFullName} placeholder="Jane Doe" />

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
        placeholder="At least 8 characters"
      />

      {error && <Text style={{ color: "#B3261E", marginBottom: 10 }}>{error}</Text>}

      <PrimaryButton title="Create account" onPress={handleRegister} loading={loading} />
    </Screen>
  );
}
