import React, { useState } from "react";
import { Text } from "react-native";
import { supabase } from "@/lib/supabase";
import { Screen, Heading, Label, FieldInput, PrimaryButton } from "@/components/ui";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    setStatus(error ? "error" : "sent");
  };

  return (
    <Screen>
      <Heading>Reset your password</Heading>

      <Label>Email</Label>
      <FieldInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
      />

      {status === "sent" && (
        <Text style={{ color: "#3E5C4E", marginBottom: 10 }}>
          Check your email for a reset link.
        </Text>
      )}
      {status === "error" && (
        <Text style={{ color: "#B3261E", marginBottom: 10 }}>
          Something went wrong. Try again.
        </Text>
      )}

      <PrimaryButton title="Send reset link" onPress={handleReset} loading={loading} />
    </Screen>
  );
}
