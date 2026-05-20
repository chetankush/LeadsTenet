import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard']

/**
 * Refreshes the Supabase auth session on every request and guards protected
 * routes. Must be called from the root `middleware.ts`.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() revalidates the token with the Supabase Auth server.
  // Do not trust getSession() in server code.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  )

  if (isProtected && !user) {
    const signInUrl = request.nextUrl.clone()
    signInUrl.pathname = '/sign-in'
    signInUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  return supabaseResponse
}
