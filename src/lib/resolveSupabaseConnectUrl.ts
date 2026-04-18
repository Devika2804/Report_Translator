/**
 * In Vite dev, use the dev server origin so requests hit `/functions/v1`, `/rest/v1`, etc.
 * locally and are proxied to Supabase. This avoids many "Failed to fetch" cases where
 * extensions or browser policies block direct calls to *.supabase.co.
 */
export function resolveSupabaseConnectUrl(): string {
  const fromEnv = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
  if (!fromEnv) return "";
  if (import.meta.env.DEV && typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return fromEnv;
}
