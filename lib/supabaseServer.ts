import { createClient } from "@supabase/supabase-js";

/**
 * Server Actions run outside the browser, so they never see the session the
 * client-side `supabase` singleton holds. The caller forwards its access token
 * and we build a short-lived client bound to it: every query then runs as that
 * user and stays subject to the same row-level security policies, instead of
 * quietly reading the whole table as an anonymous superuser would.
 */
export function createServerSupabase(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are missing on the server.");
  }

  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
