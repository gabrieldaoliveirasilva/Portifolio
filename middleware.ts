import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Acesso 100% público e irrestrito para qualquer visitante ou recrutador com o link
  if (req.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
