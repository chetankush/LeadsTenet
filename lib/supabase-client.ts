import { createClient } from '@/utils/supabase/server'

/**
 * Returns a cookie-based Supabase client scoped to the signed-in user.
 * Row Level Security applies, so every query is automatically restricted to
 * the current user's rows. Use this for all user-facing server code.
 *
 * For privileged background work (e.g. webhook handlers) use
 * `createAdminClient` from `@/utils/supabase/admin` instead.
 */
export async function getSupabaseClient() {
  return createClient()
}
