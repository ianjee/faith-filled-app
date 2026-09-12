import { supabase } from "@/lib/supabase";

/**
 * Temporary application database adapter.
 *
 * The current project's Database type is causing Supabase query builders
 * to infer table rows/inserts as `never`. This adapter preserves the
 * existing Supabase client, authentication, and RLS while allowing these
 * screens to compile and run.
 *
 * Once database.types.ts is regenerated from the live Supabase schema,
 * this file can be removed and these imports can be changed back to `supabase`.
 */
export const db = supabase as any;
