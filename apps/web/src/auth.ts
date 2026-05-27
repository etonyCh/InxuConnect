import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import crypto from "crypto"

function signJwt(payload: object, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const base64Url = (str: string) => Buffer.from(str).toString('base64url')
  const tokenHeader = base64Url(JSON.stringify(header))
  const tokenPayload = base64Url(JSON.stringify(payload))
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${tokenHeader}.${tokenPayload}`)
    .digest('base64url')
  return `${tokenHeader}.${tokenPayload}.${signature}`
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      authorize: async (credentials) => {
        // Demo: accepte les 2 comptes seed
        if (credentials?.email === 'guest@inzu.bi' && credentials?.password === 'demo123') {
          return { id: 'user_guest_1', email: 'guest@inzu.bi', name: 'Marie N.', role: 'GUEST' }
        }
        if (credentials?.email === 'host@inzu.bi' && credentials?.password === 'demo123') {
          return { id: 'user_host_1', email: 'host@inzu.bi', name: 'Jean Pierre', role: 'HOST' }
        }
        return null
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        
        // Génère le token d'API Fastify pour le stocker en session
        const jwtSecret = process.env.JWT_SECRET || 'inzuconnect-jwt-secret-dev-2026'
        token.accessToken = signJwt({ id: user.id, role: (user as any).role }, jwtSecret)
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        (session.user as any).role = token.role as string
        (session as any).accessToken = token.accessToken as string
      }
      return session
    }
  },
  pages: { signIn: '/login' }
})
