import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""

export const isSupabaseConfigured = Boolean(url && publishableKey)

let client: SupabaseClient | null = null

/**
 * The browser's Supabase client, used ONLY for authentication (all data goes through our API).
 * Created on first use, so nothing runs while pages are prerendered on the server.
 * Returns null when the environment variables are missing.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  client ??= createClient(url, publishableKey)
  return client
}
