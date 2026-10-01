import type { DefaultSession } from "next-auth";

// El callback session de src/server/auth.ts agrega user.id
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}
