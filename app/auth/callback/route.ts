import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseAdmin } from '@/utils/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Auto-provision user in public.users table if they don't exist yet
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const adminDb = getSupabaseAdmin()
        const { data: existingUser } = await adminDb
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (!existingUser) {
          await adminDb.from('users').insert({
            auth_user_id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
            subscription_tier: 'free',
            subscription_status: 'active',
            emails_per_month: 100,
            campaigns_limit: 5,
            leads_per_upload: 500,
          })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`)
}
