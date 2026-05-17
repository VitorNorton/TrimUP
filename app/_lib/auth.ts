import { PrismaAdapter } from "@auth/prisma-adapter"
import { AuthOptions } from "next-auth"
import { db } from "./prisma"
import { Adapter } from "next-auth/adapters"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        login: { label: "Email ou telefone", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null

        const isPhone = /^\d+$/.test(credentials.login.replace(/\D/g, ""))

        const user = await db.user.findFirst({
          where: isPhone
            ? { phone: credentials.login.replace(/\D/g, "") }
            : { email: credentials.login },
        })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return user
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Populate on initial sign-in
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      // token.sub is always set by NextAuth to the user ID (including Google OAuth)
      // Fetch role from DB if missing — happens when Google user's role isn't in user object
      if (!token.role) {
        const id = (token.id ?? token.sub) as string | undefined
        if (id) {
          try {
            const dbUser = await db.user.findUnique({
              where: { id },
              select: { id: true, role: true },
            })
            if (dbUser) {
              token.id = dbUser.id
              token.role = dbUser.role
            }
          } catch {}
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: (token.id ?? token.sub) as string,
        role: token.role as any,
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
