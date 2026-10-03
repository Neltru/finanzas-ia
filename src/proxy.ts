import { withAuth } from "next-auth/middleware";

// Antes middleware.ts (Next 16 lo renombra a proxy). No lee authOptions: hay que repetir aquí la página de login
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/overview/:path*",
    "/transactions/:path*",
    "/accounts/:path*",
    "/insights/:path*",
    "/projections/:path*",
    "/connect/:path*",
  ],
};
