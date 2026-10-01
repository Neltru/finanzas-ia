import { withAuth } from "next-auth/middleware";

// El middleware no lee authOptions: hay que repetir aquí la página de login
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
