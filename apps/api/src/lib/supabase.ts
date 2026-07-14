import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Public Supabase client — uses the anon key, respects Row-Level Security.
 * Use this for operations that run in the context of an authenticated user.
 */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // Server-side: no persistent sessions
  },
});

/**
 * Supabase admin client — uses the service role key, bypasses Row-Level Security.
 * Use ONLY for trusted server-side operations (migrations, admin tasks, background jobs).
 * Never expose this client to the client side or untrusted callers.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
