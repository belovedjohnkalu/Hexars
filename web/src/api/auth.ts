import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
export const supabase = url && key ? createClient(url, key) : null;
let signingIn: Promise<string> | null = null;

// Opening the homepage is read-only. Create a guest account only when playing.
export async function accessToken(): Promise<string> {
  if (!supabase) throw new Error("Game sign-in is not configured.");
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session) return data.session.access_token;
  if (!signingIn) {
    signingIn = supabase.auth.signInAnonymously().then(({ data, error }) => {
      if (error) throw error;
      if (!data.session) throw new Error("Unable to open a guest account.");
      return data.session.access_token;
    }).finally(() => { signingIn = null; });
  }
  return signingIn;
}
