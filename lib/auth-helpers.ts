import { createClient } from '@/utils/supabase/server'

/**
 * Resolves the authenticated Supabase user for a Route Handler / Server Action.
 * Returns the request-scoped client and the verified user (or null).
 *
 * `getUser()` revalidates the JWT against the Supabase Auth server, so the
 * returned user can be trusted for authorization decisions.
 */
export async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}
