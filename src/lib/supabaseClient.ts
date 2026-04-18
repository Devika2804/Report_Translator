import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseConnectUrl } from "@/lib/resolveSupabaseConnectUrl";

const supabaseUrl = resolveSupabaseConnectUrl();
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (import.meta.env.DEV) {
  console.log("Supabase URL:", supabaseUrl);
  console.log(
    "Supabase Key:",
    supabaseKey ? `${String(supabaseKey).slice(0, 12)}…` : "(missing — check .env)"
  );
}

if (!supabaseUrl?.trim() || !supabaseKey?.trim()) {
  throw new Error(
    "Supabase env missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the project root .env, then restart the Vite dev server."
  );
}

export const supabase = createClient(supabaseUrl.trim(), supabaseKey.trim());