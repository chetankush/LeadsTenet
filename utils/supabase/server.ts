import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cookie-based Supabase client for Server Components, Route Handlers and
 * Server Actions. Authenticates as the signed-in user (anon key + the
 * session stored in cookies), so Row Level Security applies.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // `setAll` is called from a Server Component where cookies are
            // read-only. The session is refreshed in middleware instead, so
            // this can be safely ignored.
          }
        },
      },
    }
  )
}
