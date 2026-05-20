import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser Supabase client for Client Components. Reads/writes the session
 * from cookies so it stays in sync with the server.
 *
 * NOTE: typed as the default (loose) schema because `types/database.types.ts`
 * is currently an empty stub. Regenerate it with
 * `supabase gen types typescript` and re-add the `<Database>` generic for
 * end-to-end query typing.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
