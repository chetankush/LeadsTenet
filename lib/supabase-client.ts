import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

// Simple Supabase client factory that works with Clerk
export async function getSupabaseClient() {
  try {
    const { getToken } = await auth()
    
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: async (url, options = {}) => {
            try {
              const clerkToken = await getToken({
                template: 'supabase',
              })

              const headers = new Headers(options?.headers)
              if (clerkToken) {
                headers.set('Authorization', `Bearer ${clerkToken}`)
              }

              return fetch(url, {
                ...options,
                headers,
              })
            } catch (error) {
              // If Clerk token fails, use default fetch
              return fetch(url, options)
            }
          },
        },
      }
    )
  } catch (error) {
    // Fallback to basic Supabase client
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
}