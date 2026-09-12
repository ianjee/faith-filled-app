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

/** Faith-Filled Bodywork visual system.
 * Warm ivory + muted sage + champagne gold, inspired by the website.
 */
export const COLORS = {
  sageDeep: "#6F7C63",
  sage: "#8D967B",
  sagePale: "#EEF0E8",
  gold: "#B58A50",
  goldPale: "#F4EBDD",
  ink: "#2E302A",
  inkMid: "#686961",
  cream: "#F7F5EF",
  white: "#FFFDF8",
  border: "#E3DED2",
  danger: "#A84A43",
};

export function Screen({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function BrandMark() {
  return (
    <View style={styles.brandWrap}>
      <View style={styles.brandCircle}>
        <Text style={styles.brandInitial}>F</Text>
      </View>
      <Text style={styles.brandName}>FAITH-FILLED</Text>
      <Text style={styles.brandSub}>BODYWORK</Text>
    </View>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Heading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Subheading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subheading}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
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

export function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
      <Text style={styles.secondaryButtonText}>{title}</Text>
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

export function IconTile({ icon, color = COLORS.sagePale }: { icon: string; color?: string }) {
  return (
    <View style={[styles.iconTile, { backgroundColor: color }]}>
      <Text style={styles.iconText}>{icon}</Text>
    </View>
  );
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.cream,
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  brandWrap: { alignItems: "center", marginBottom: 30 },
  brandCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  brandInitial: { fontFamily: "Georgia", fontSize: 38, fontStyle: "italic", color: COLORS.ink },
  brandName: { fontSize: 13, letterSpacing: 3.2, color: COLORS.sageDeep },
  brandSub: { fontSize: 8, letterSpacing: 2.8, color: COLORS.gold, marginTop: 2 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.8,
    color: COLORS.sageDeep,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  heading: {
    fontFamily: "Georgia",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "400",
    color: COLORS.ink,
    marginBottom: 7,
  },
  subheading: { fontSize: 15, lineHeight: 22, color: COLORS.inkMid, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8, color: COLORS.sageDeep, marginBottom: 7 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.ink,
    marginBottom: 15,
    backgroundColor: COLORS.white,
  },
  button: {
    backgroundColor: COLORS.sageDeep,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 5,
    shadowColor: COLORS.sageDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryButton: {
    backgroundColor: COLORS.goldPale,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8D6BA",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  buttonText: { color: COLORS.white, fontSize: 15, fontWeight: "700", letterSpacing: 0.4 },
  secondaryButtonText: { color: COLORS.ink, fontSize: 15, fontWeight: "700" },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.sagePale,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 7,
  },
  pillText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.7, color: COLORS.sageDeep, textTransform: "uppercase" },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconText: { fontSize: 19, color: COLORS.sageDeep },
  statCard: {
    flex: 1,
    minWidth: 95,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  statValue: { fontFamily: "Georgia", fontSize: 26, color: COLORS.sageDeep, marginBottom: 4 },
  statLabel: { fontSize: 10, letterSpacing: 0.8, color: COLORS.inkMid, textTransform: "uppercase" },
});
