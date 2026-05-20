import { createClient } from "@supabase/supabase-js"

// Service-role client. Bypasses RLS — use ONLY in trusted server-side code
// (e.g. the Dodo webhook handler). Never import this into client components.
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}
