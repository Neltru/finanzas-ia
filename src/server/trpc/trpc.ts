import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { getServerSession } from "next-auth";
import { db } from "@/server/db";
import { authOptions, isDemoSession } from "@/server/auth";


export const createContext = async () => {
  const session = await getServerSession(authOptions);
  return { db, session };
};

const t = initTRPC.context<typeof createContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Solo pasa si hay sesión; y deja userId garantizado en el contexto
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  const userId = (ctx.session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { ...ctx, userId },
  });
});
// Para mutaciones: la cuenta demo es compartida, nadie debe poder cambiarla
export const writeProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (isDemoSession(ctx.session)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "La cuenta demo es de solo lectura" });
  }
  return next();
});
