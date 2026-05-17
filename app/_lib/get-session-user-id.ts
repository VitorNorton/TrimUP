"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { decode } from "next-auth/jwt"
import { cookies } from "next/headers"

export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (session?.user?.id) return session.user.id

  // Fallback: decode JWT cookie directly (handles Google OAuth / token mismatch)
  const cookieStore = cookies()
  const tokenValue =
    cookieStore.get("next-auth.session-token")?.value ??
    cookieStore.get("__Secure-next-auth.session-token")?.value

  if (!tokenValue) return null

  try {
    const token = await decode({
      token: tokenValue,
      secret: process.env.NEXTAUTH_SECRET!,
    })
    return ((token?.id ?? token?.sub) as string | undefined) ?? null
  } catch {
    return null
  }
}
