import { createClient } from "@supabase/supabase-js"

// Server-side Supabase client using service role key.
// This bypasses RLS — only use in trusted server-side code.
// Lazily initialized to avoid build-time errors when env vars are not set.
// Note: Database types have empty Tables — using untyped client until types are regenerated.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabaseAdmin: any = null
export function getSupabaseAdmin(): any {
    if (!_supabaseAdmin) {
        _supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        )
    }
    return _supabaseAdmin
}
