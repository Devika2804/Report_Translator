import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";

const deploySteps = (name: string) =>
  `Deploy it: in the project folder run "npx supabase login", then "npx supabase link --project-ref <your-project-ref>", ` +
  `"npx supabase secrets set LOVABLE_API_KEY=<your-lovable-ai-key>", then "npx supabase functions deploy ${name}".`;

/**
 * Turns supabase-js function errors into actionable UI copy.
 */
export async function formatSupabaseFunctionError(
  error: unknown,
  functionName: string
): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    const res = error.context;
    try {
      const body = await res.clone().json();
      if (res.status === 404 || body?.code === "NOT_FOUND") {
        return `Edge Function "${functionName}" is not on this Supabase project (404). ${deploySteps(functionName)}`;
      }
      if (typeof body?.error === "string") return body.error;
    } catch {
      /* ignore JSON parse errors */
    }
    return error.message;
  }

  if (error instanceof FunctionsFetchError) {
    const ctx = error.context as { message?: string; name?: string } | undefined;
    const detail =
      ctx && typeof ctx === "object" && typeof ctx.message === "string" ? ctx.message : "";
    if (/failed to fetch|networkerror|load failed/i.test(detail)) {
      return (
        `Could not reach Supabase (${detail}). Check your internet, VPN, firewall, or browser extensions ` +
        `(some ad blockers block *.supabase.co). If the problem persists, confirm "${functionName}" is deployed.`
      );
    }
    return detail
      ? `Could not call Edge Function "${functionName}": ${detail}`
      : `Could not call Edge Function "${functionName}". Check your connection and try again.`;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown error";
}
