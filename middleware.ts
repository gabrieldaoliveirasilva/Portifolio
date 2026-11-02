// AI maintenance map: canonical route protection. Local hosts bypass auth for
// development; production authentication settings live in lib/auth.ts.
import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

function isLocalHost(host: string) {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.includes("192.168.");
}

const nextAuthSecret =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV === "development" ? "local-dev-secret-only-for-front-tests" : undefined);

export default withAuth(
  function middleware(req) {
    const host = req.headers.get("host") || "";
    const isLoginPage = req.nextUrl.pathname.startsWith("/login");

    if (isLocalHost(host) && isLoginPage) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }

    if (isLocalHost(host)) {
      return NextResponse.next();
    }

    if (req.nextauth.token && isLoginPage) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login"
    },
    secret: nextAuthSecret,
    callbacks: {
      authorized: ({ req, token }) => {
        const host = req.headers.get("host") || "";
        if (isLocalHost(host)) return true;
        if (req.nextUrl.pathname.startsWith("/login")) return true;
        return Boolean(token);
      }
    }
  }
);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"]
};
