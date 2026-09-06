import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

export const COLORS = {
  sageDeep: "#3E5C4E",
  sage: "#6E8C7E",
  sagePale: "#EEF3EC",
  gold: "#B8946A",
  ink: "#1E1E1C",
  inkMid: "#4A4A47",
  cream: "#FDFCFA",
  white: "#FFFFFF",
  border: "#E4E0D6",
};

export function Screen({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Heading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function FieldInput(props: TextInputProps) {
  return <TextInput style={styles.input} placeholderTextColor="#9A9A94" {...props} />;
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.white} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Pill({ text }: { text: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.cream, padding: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  heading: { fontSize: 22, fontWeight: "600", color: COLORS.ink, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.sageDeep, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.ink,
    marginBottom: 14,
    backgroundColor: COLORS.white,
  },
  button: {
    backgroundColor: COLORS.sageDeep,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.sagePale,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  pillText: { fontSize: 11, fontWeight: "600", color: COLORS.sageDeep },
});
