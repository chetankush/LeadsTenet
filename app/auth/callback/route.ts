import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * OAuth / email-confirmation callback. Exchanges the auth code for a session
 * (PKCE), sets the session cookies, then redirects into the app.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectParam = searchParams.get('redirect') || '/dashboard'
  // Only allow internal relative redirects to avoid open-redirect abuse.
  const redirect = redirectParam.startsWith('/') ? redirectParam : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`)
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`)
}
