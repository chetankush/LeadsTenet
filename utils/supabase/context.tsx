"use client"

import { createClient } from "@/utils/supabase/client"
import { createContext, useContext, useMemo, ReactNode } from "react"

type SupabaseClient = ReturnType<typeof createClient>

const SupabaseContext = createContext<SupabaseClient | undefined>(undefined)

export function SupabaseProvider({ children }: { children: ReactNode }) {
    const supabase = useMemo(() => createClient(), [])

    return (
        <SupabaseContext.Provider value={supabase}>
            {children}
        </SupabaseContext.Provider>
    )
}

// Hook to use the Supabase client
export function useSupabase() {
    const context = useContext(SupabaseContext)
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider')
    }
    return context
}
