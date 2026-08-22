import { supabase } from "@/integrations/supabase/client";

/** Thin wrapper so every service surfaces a readable error message. */
export function unwrap<T>(
  result: { data: T | null; error: { message: string } | null },
  context: string,
): T {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }
  return result.data as T;
}

export async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

export { supabase };
