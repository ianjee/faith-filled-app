import React, { createContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database.types";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  appLocked: boolean;
  pinAvailable: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setPin: (pin: string) => Promise<{ error: string | null }>;
  unlockWithPin: (pin: string) => Promise<{ error: string | null }>;
  clearPin: () => Promise<void>;
  checkPin: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PIN_KEY = "faith_filled_app_pin";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinAvailable, setPinAvailable] = useState(false);
  const [appLocked, setAppLocked] = useState(false);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) {
      console.warn("Failed to load profile:", error.message);
      setProfile(null);
      return;
    }

    setProfile(data as Profile);
  };

  const checkPin = async () => {
    try {
      const pin = await SecureStore.getItemAsync(PIN_KEY);
      const exists = !!pin;

      setPinAvailable(exists);
      setAppLocked(exists && !!session);
    } catch (error) {
      console.warn("Failed to check PIN:", error);
      setPinAvailable(false);
      setAppLocked(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!mounted) return;

        const currentSession = sessionData.session;
        setSession(currentSession);

        if (currentSession?.user) {
          await loadProfile(currentSession.user.id);

          const storedPin = await SecureStore.getItemAsync(PIN_KEY);

          if (mounted) {
            setPinAvailable(!!storedPin);
            setAppLocked(!!storedPin);
          }
        } else {
          setProfile(null);
          setPinAvailable(false);
          setAppLocked(false);
        }
      } catch (error) {
        console.warn("Authentication initialization failed:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);

      if (newSession?.user) {
        await loadProfile(newSession.user.id);

        const storedPin = await SecureStore.getItemAsync(PIN_KEY);

        if (mounted) setPinAvailable(!!storedPin);
      } else {
        setProfile(null);
        setPinAvailable(false);
        setAppLocked(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthContextValue["signUp"] = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return { error: error.message };

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        role: "client",
      });

      if (profileError) return { error: profileError.message };
    }

    return { error: null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      setProfile(null);
      setAppLocked(false);
      setPinAvailable(false);
      await SecureStore.deleteItemAsync(PIN_KEY);
    }
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  const setPin = async (pin: string) => {
    if (!/^\d{4}$/.test(pin)) return { error: "PIN must be exactly 4 digits." };

    try {
      await SecureStore.setItemAsync(PIN_KEY, pin);
      setPinAvailable(true);
      setAppLocked(false);
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unable to save PIN.",
      };
    }
  };

  const unlockWithPin = async (pin: string) => {
    if (!/^\d{4}$/.test(pin)) return { error: "Enter your 4-digit PIN." };

    try {
      const savedPin = await SecureStore.getItemAsync(PIN_KEY);

      if (!savedPin) return { error: "No PIN has been created." };
      if (savedPin !== pin) return { error: "Incorrect PIN." };

      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        setAppLocked(false);
        return {
          error: "Your session has expired. Please sign in with your email and password.",
        };
      }

      setSession(sessionData.session);
      await loadProfile(sessionData.session.user.id);
      setAppLocked(false);

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unable to unlock the app.",
      };
    }
  };

  const clearPin = async () => {
    await SecureStore.deleteItemAsync(PIN_KEY);
    setPinAvailable(false);
    setAppLocked(false);
  };

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      appLocked,
      pinAvailable,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      setPin,
      unlockWithPin,
      clearPin,
      checkPin,
    }),
    [session, profile, loading, appLocked, pinAvailable]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}