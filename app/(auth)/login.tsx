import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import {
  Screen,
  Eyebrow,
  Heading,
  Subheading,
  Label,
  FieldInput,
  PrimaryButton,
  COLORS,
} from "@/components/ui";

export default function Login() {
  const {
    session,
    profile,
    signIn,
    setPin,
    unlockWithPin,
    pinAvailable,
  } = useAuth();

  const [pin, setPinValue] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [creatingPin, setCreatingPin] =
    useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  /*
   * If an existing Supabase session has a PIN,
   * this screen becomes the PIN unlock screen.
   */
  const [showPin, setShowPin] =
    useState(false);

  useEffect(() => {
    if (session && profile && pinAvailable) {
      setShowPin(true);
    }
  }, [session, profile, pinAvailable]);

  const handlePasswordLogin = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    setLoading(true);

    const result = await signIn(
      email.trim(),
      password
    );

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    /*
     * After a successful password login,
     * allow the user to create a PIN.
     */
    setCreatingPin(true);
  };

  const handleCreatePin = async () => {
    setError(null);

    if (!/^\d{4}$/.test(pin)) {
      setError(
        "PIN must be exactly 4 digits."
      );
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }

    setLoading(true);

    const result = await setPin(pin);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.replace("/");
  };

  const handleUnlock = async () => {
    setError(null);

    if (!/^\d{4}$/.test(pin)) {
      setError(
        "Please enter your 4-digit PIN."
      );
      return;
    }

    setLoading(true);

    const result =
      await unlockWithPin(pin);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.replace("/");
  };

  /*
   * Existing authenticated user with a PIN.
   */
  if (showPin) {
    return (
      <Screen>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 30,
          }}
        >
          <Image
            source={require("../../assets/faith-filled-bodywork-logo-newer.png")}
            style={{
              width: 180,
              height: 180,
              alignSelf: "center",
              marginBottom: 20,
            }}
            resizeMode="contain"
          />

          <Eyebrow>
            Quick access
          </Eyebrow>

          <Heading>
            Welcome back
          </Heading>

          <Subheading>
            Enter your 4-digit PIN to continue.
          </Subheading>

          <Label>
            4-digit PIN
          </Label>

          <FieldInput
            value={pin}
            onChangeText={(value) =>
              setPinValue(
                value
                  .replace(/\D/g, "")
                  .slice(0, 4)
              )
            }
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholder="Enter PIN"
          />

          {error && (
            <View
              style={{
                backgroundColor:
                  "#F8E9E6",
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: COLORS.danger,
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                {error}
              </Text>
            </View>
          )}

          <PrimaryButton
            title="Unlock"
            onPress={handleUnlock}
            loading={loading}
          />

          <Link
            href="/(auth)/login"
            onPress={() => {
              setShowPin(false);
              setError(null);
              setPinValue("");
            }}
            style={{
              color: COLORS.sageDeep,
              textAlign: "center",
              marginTop: 18,
              fontWeight: "600",
            }}
          >
            Use email & password
          </Link>
        </ScrollView>
      </Screen>
    );
  }

  /*
   * User has just successfully logged in
   * and is creating their PIN.
   */
  if (creatingPin) {
    return (
      <Screen>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 30,
          }}
        >
          <Image
            source={require("../../assets/faith-filled-bodywork-logo-newer.png")}
            style={{
              width: 180,
              height: 180,
              alignSelf: "center",
              marginBottom: 20,
            }}
            resizeMode="contain"
          />

          <Eyebrow>
            Quick login
          </Eyebrow>

          <Heading>
            Create your PIN
          </Heading>

          <Subheading>
            Create a 4-digit PIN for faster
            access on this device.
          </Subheading>

          <Label>
            4-digit PIN
          </Label>

          <FieldInput
            value={pin}
            onChangeText={(value) =>
              setPinValue(
                value
                  .replace(/\D/g, "")
                  .slice(0, 4)
              )
            }
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholder="Enter 4 digits"
          />

          <Label>
            Confirm PIN
          </Label>

          <FieldInput
            value={confirmPin}
            onChangeText={(value) =>
              setConfirmPin(
                value
                  .replace(/\D/g, "")
                  .slice(0, 4)
              )
            }
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholder="Enter PIN again"
          />

          {error && (
            <View
              style={{
                backgroundColor:
                  "#F8E9E6",
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: COLORS.danger,
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                {error}
              </Text>
            </View>
          )}

          <PrimaryButton
            title="Create PIN"
            onPress={handleCreatePin}
            loading={loading}
          />

          <View style={{ height: 12 }} />

          <PrimaryButton
            title="Skip for now"
            onPress={() => router.replace("/")}
          />
        </ScrollView>
      </Screen>
    );
  }

  /*
   * Normal email/password login.
   */
  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
      >
        <Image
            source={require("../../assets/faith-filled-bodywork-logo-newer.png")}
            style={{
              width: 180,
              height: 180,
              alignSelf: "center",
              marginBottom: 20,
            }}
            resizeMode="contain"
          />

        <Eyebrow>
          Private Wellness Portal
        </Eyebrow>

        <Heading>
          Welcome back
        </Heading>

        <Subheading>
          Sign in to continue your
          Faith-Filled Bodywork experience.
        </Subheading>

        <View style={{ marginTop: 4 }}>
          <Label>
            Email address
          </Label>

          <FieldInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            placeholder="you@example.com"
          />

          <Label>
            Password
          </Label>

          <FieldInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter your password"
          />
        </View>

        {error && (
          <View
            style={{
              backgroundColor:
                "#F8E9E6",
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: COLORS.danger,
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              {error}
            </Text>
          </View>
        )}

        <PrimaryButton
          title="Sign in"
          onPress={handlePasswordLogin}
          loading={loading}
        />

        <Link
          href="/(auth)/forgot-password"
          style={{
            color: COLORS.sageDeep,
            textAlign: "center",
            marginTop: 18,
            fontWeight: "600",
          }}
        >
          Forgot password?
        </Link>

        <View
          style={{
            height: 1,
            backgroundColor: COLORS.border,
            marginVertical: 25,
          }}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <Text
            style={{
              color: COLORS.inkMid,
            }}
          >
            New here?
          </Text>

          <Link
            href="/(auth)/register"
            style={{
              color: COLORS.gold,
              fontWeight: "700",
            }}
          >
            Create an account
          </Link>
        </View>
      </ScrollView>
    </Screen>
  );
}
