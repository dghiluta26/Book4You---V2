"use client"

import type { Session, User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase"
import { authErrorKey, type AuthErrorKey } from "./errors"

type AuthStatus = "loading" | "signedIn" | "signedOut"

type AuthResult = { error: AuthErrorKey | null }

type AuthContextValue = {
  status: AuthStatus
  user: User | null
  /** Display name: the full name, or the part of the email before "@". */
  name: string
  /** Sent to our API as "Authorization: Bearer <token>". Refreshed automatically by Supabase. */
  accessToken: string | null
  signIn: (email: string, password: string) => Promise<AuthResult>
  /** needsConfirmation is true when Supabase requires the user to confirm their email first. */
  signUp: (name: string, email: string, password: string) => Promise<AuthResult & { needsConfirmation: boolean }>
  signOut: () => Promise<void>
  updateName: (name: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const NOT_CONFIGURED: AuthResult = { error: "auth.error.notConfigured" }

export function AuthProvider({ children }: { children: ReactNode }) {
  // undefined = we do not know yet; null = signed out
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return
    // Fires immediately with the stored session, then on every login, logout and token refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null
    const fullName = (user?.user_metadata?.full_name as string | undefined)?.trim()
    const status: AuthStatus = !isSupabaseConfigured
      ? "signedOut"
      : session === undefined
        ? "loading"
        : session
          ? "signedIn"
          : "signedOut"

    return {
      status,
      user,
      name: fullName || user?.email?.split("@")[0] || "",
      accessToken: session?.access_token ?? null,

      async signIn(email, password) {
        const supabase = getSupabase()
        if (!supabase) return NOT_CONFIGURED
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error ? authErrorKey(error) : null }
      },

      async signUp(name, email, password) {
        const supabase = getSupabase()
        if (!supabase) return { ...NOT_CONFIGURED, needsConfirmation: false }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/login` },
        })
        if (error) return { error: authErrorKey(error), needsConfirmation: false }
        return { error: null, needsConfirmation: !data.session }
      },

      async signOut() {
        await getSupabase()?.auth.signOut()
      },

      async updateName(name) {
        const supabase = getSupabase()
        if (!supabase) return NOT_CONFIGURED
        const { error } = await supabase.auth.updateUser({ data: { full_name: name } })
        if (error) return { error: authErrorKey(error) }
        await supabase.auth.refreshSession() // so the token carries the new name too
        return { error: null }
      },
    }
  }, [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>")
  return context
}
