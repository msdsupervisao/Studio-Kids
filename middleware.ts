import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/services/supabase/middleware";
import { ROUTES } from "@/lib/constants";

const PUBLIC_PATHS = [ROUTES.login, ROUTES.forgotPassword];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, supabaseResponse, user } = await updateSession(request);

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!user) {
    if (isPublicPath) return supabaseResponse;
    const redirectUrl = new URL(ROUTES.login, request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isPublicPath) {
    return NextResponse.redirect(new URL(ROUTES.home, request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Trigger de criacao de profile ainda nao processou; deixa passar
    // para nao travar o usuario num loop de redirect.
    return supabaseResponse;
  }

  if (!profile.onboarding_completed_at && pathname !== ROUTES.firstAccess) {
    return NextResponse.redirect(new URL(ROUTES.firstAccess, request.url));
  }

  if (pathname.startsWith(ROUTES.professor) && !["professor", "admin"].includes(profile.role)) {
    return NextResponse.redirect(new URL(ROUTES.home, request.url));
  }

  if (pathname.startsWith(ROUTES.admin) && profile.role !== "admin") {
    return NextResponse.redirect(new URL(ROUTES.home, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
