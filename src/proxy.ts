import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const AUTH_PATHS = ["/login", "/signup"];
// /admin is deliberately excluded — it has its own password-gated session
// (see src/lib/admin-auth.ts), entirely independent of Supabase Auth and
// the hunter Profile system.
const APP_PATHS = [
  "/dashboard",
  "/quests",
  "/focus-lock",
  "/history",
  "/achievements",
  "/wallet",
  "/settings",
  "/notifications",
  "/billing",
  "/locked",
  "/change-password",
  "/character-creation",
  "/onboarding",
  "/checkout",
  "/delete-account",
  "/subscription-expired",
];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (user && AUTH_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!user && APP_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
