import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'

// Demo users for the RailOpt AI prototype
const DEMO_USERS = [
  { id: 'user-admin', email: 'admin@railopt.ai', password: 'admin123', name: 'Dhittika', role: 'admin' },
  { id: 'user-planner', email: 'planner@railopt.ai', password: 'planner123', name: 'Jeet', role: 'planner' },
  { id: 'user-control', email: 'control@railopt.ai', password: 'control123', name: 'Diya', role: 'control_office' },
  { id: 'user-engineering', email: 'engineering@railopt.ai', password: 'eng123', name: 'Debarshi', role: 'engineering' },
  { id: 'user-snt', email: 'snt@railopt.ai', password: 'snt123', name: 'Rupam', role: 'snt' },
  { id: 'user-traction', email: 'traction@railopt.ai', password: 'trac123', name: 'Alivia', role: 'traction' },
]

// Google OAuth is available if env vars are set
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      const user = DEMO_USERS.find(
        (u) => u.email === credentials.email && u.password === credentials.password
      )

      if (!user) {
        return null
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    },
  }),
]

// Add Google provider only if credentials are configured
if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // Default role for Google sign-in — admin can change later
          role: 'planner',
        }
      },
    })
  )
}

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as { role?: string }).role
        token.id = user.id
      }
      // For Google OAuth, set a default role if not set
      if (account?.provider === 'google' && !token.role) {
        token.role = 'planner'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string
        ;(session.user as { id?: string }).id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/', // We handle sign-in on the main page
  },
  secret: process.env.NEXTAUTH_SECRET || 'railopt-ai-dev-secret-key-2025',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
