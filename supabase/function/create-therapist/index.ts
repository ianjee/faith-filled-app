// @ts-nocheck

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(token);

    if (userError || !user) {
      console.error("User authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: requester,
      error: requesterError,
    } = await adminClient
      .from("profiles")
      .select("id, role, clinic_id")
      .eq("id", user.id)
      .maybeSingle();

    if (requesterError) {
      console.error("Error loading requester profile:", requesterError);
      return new Response(
        JSON.stringify({ error: requesterError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!requester) {
      return new Response(
        JSON.stringify({ error: "Your profile could not be found." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (requester.role !== "admin" && requester.role !== "owner") {
      return new Response(
        JSON.stringify({ error: "Only admins or owners can create therapist accounts." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { full_name, email, password, clinic_id } = await req.json();

    if (!full_name || !email || !password || !clinic_id) {
      return new Response(
        JSON.stringify({ error: "Full name, email, password, and clinic_id are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (requester.clinic_id !== clinic_id) {
      return new Response(
        JSON.stringify({ error: "You cannot create an account for another clinic." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      data: createdUser,
      error: createUserError,
    } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createUserError || !createdUser.user) {
      console.error("Error creating auth user:", createUserError);
      return new Response(
        JSON.stringify({
          error: createUserError?.message || "Could not create authentication account.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = createdUser.user.id;

    const { error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: userId,
        full_name,
        email,
        role: "therapist",
        clinic_id,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      await adminClient.auth.admin.deleteUser(userId);

      return new Response(
        JSON.stringify({
          error: "Therapist account was created but the profile could not be created.",
          details: profileError.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: therapistError } = await adminClient
      .from("therapists")
      .insert({
        id: userId,
        clinic_id,
        specialties: [],
      });

    if (therapistError) {
      console.error("Error creating therapist record:", therapistError);

      await adminClient.from("profiles").delete().eq("id", userId);
      await adminClient.auth.admin.deleteUser(userId);

      return new Response(
        JSON.stringify({
          error: "Therapist account was created but the therapist record could not be created.",
          details: therapistError.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Therapist created successfully: ${userId}`);

    return new Response(
      JSON.stringify({
        ok: true,
        user_id: userId,
        message: "Therapist account created successfully.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unexpected server error.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});