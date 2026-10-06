import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { db } from "@/server/db";
import CredentialsProvider from "next-auth/providers/credentials";
import { DEMO_EMAIL, isDemoEmail } from "@/lib/demo";

// La cuenta demo la comparte cualquiera que entre: es de solo lectura
export const isDemoSession = (session: { user?: { email?: string | null } } | null) =>
  isDemoEmail(session?.user?.email);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(
    new Proxy(db, {
      get: (target, prop) =>
        prop === "account" ? target.account_Auth : Reflect.get(target, prop),
    }),
  ) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "demo",
      name: "Cuenta demo",
      credentials: {},
    async authorize() {
      // Usuario fijo con los datos sembrados, solo lectura conceptual
      const user = await db.user.findUnique({
        where: { email: DEMO_EMAIL },
      });
      return user ? { id: user.id, email: user.email, name: user.name } : null;
    },
    }),
  ],
  // JWT en vez de sesión en BD: next-auth/middleware solo sabe leer JWT.
  // El adaptador sigue guardando User y Account_Auth en Prisma.
  session: { strategy: "jwt" },

  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.id = user.id;
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.id as string },
    }),
  },
  pages: { signIn: "/login" },
};