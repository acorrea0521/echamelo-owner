import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/verify-email",
  "/auth/callback",
  "/terms",
  "/privacy",
  "/forgot-password",
];
const ONBOARDING_PATHS = [
  "/onboarding/role",
  "/onboarding/category",
  "/onboarding/seller-application",
  "/onboarding/stripe",
  "/onboarding/payment",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // API routes handle their own auth (session checks, admin re-verification,
  // signature verification for webhooks) and must return JSON, not an HTML
  // redirect to /login — never redirect requests under /api.
  if (pathname.startsWith("/api")) {
    return supabaseResponse;
  }

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isOnboardingPath = ONBOARDING_PATHS.some((path) => pathname.startsWith(path));
  const isMarketingRoot = pathname === "/";

  function redirectTo(path: string) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.redirect(url);
  }

  if (!user && !isPublicPath && !isMarketingRoot) {
    return redirectTo("/login");
  }

  if (!user) {
    return supabaseResponse;
  }

  if (!user.email_confirmed_at && pathname !== "/verify-email" && !isPublicPath) {
    return redirectTo("/verify-email");
  }

  if (user.email_confirmed_at && !isPublicPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, category_id, is_admin, stripe_payment_method_id, seller_status")
      .eq("id", user.id)
      .single();

    if (!profile?.role && !isOnboardingPath) {
      return redirectTo("/onboarding/role");
    }

    if (
      profile?.role === "seller" &&
      !profile.category_id &&
      (pathname.startsWith("/go-live") || pathname.startsWith("/stream")) &&
      !isOnboardingPath
    ) {
      return redirectTo("/onboarding/category");
    }

    // Category picked but the seller isn't fully approved yet (content/
    // identity review and/or Stripe Connect banking pending) — block
    // /go-live specifically until seller_status = 'activo'. Sellers can
    // still watch other streams on /stream while pending.
    if (
      profile?.role === "seller" &&
      profile.category_id &&
      profile.seller_status !== "activo" &&
      pathname.startsWith("/go-live") &&
      !isOnboardingPath
    ) {
      return redirectTo(
        profile.seller_status === "aprobado_pendiente_stripe"
          ? "/onboarding/stripe"
          : "/onboarding/seller-application",
      );
    }

    // Buyers can browse freely, but bidding happens on /stream — require a
    // saved payment method before letting them in there.
    if (
      profile?.role === "buyer" &&
      !profile.stripe_payment_method_id &&
      pathname.startsWith("/stream") &&
      !isOnboardingPath
    ) {
      return redirectTo("/onboarding/payment");
    }

    if (pathname.startsWith("/admin") && !profile?.is_admin) {
      return redirectTo("/home");
    }
  }

  return supabaseResponse;
}
