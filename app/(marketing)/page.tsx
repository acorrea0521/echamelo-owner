import Image from "next/image";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FallingBoxes } from "@/components/marketing/FallingBoxes";
import { LiveTicker } from "@/components/marketing/LiveTicker";
import { ContactDialog } from "@/components/marketing/ContactDialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { name: "Moda", emoji: "👗", color: "text-blue-400" },
  { name: "Joyería", emoji: "💎", color: "text-teal-400" },
  { name: "Tecnología", emoji: "📱", color: "text-rose-400" },
  { name: "Artesanías", emoji: "🌵", color: "text-emerald-400" },
  { name: "Gaming", emoji: "🎮", color: "text-violet-400" },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/home");
  }

  // Schema may not be migrated in every environment yet — degrade gracefully.
  let liveSellerCount = 0;
  try {
    const { count } = await supabase
      .from("streams")
      .select("id", { count: "exact", head: true })
      .eq("status", "live");
    liveSellerCount = count ?? 0;
  } catch {
    liveSellerCount = 0;
  }

  return (
    <div className="bg-dot-pattern relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6 py-16">
      <FallingBoxes />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <div className="brand-gradient absolute inset-0 -z-10 rounded-full blur-3xl opacity-40" />
            <Image
              src="/brand/logo.jpg"
              alt="¡ECHAMELO!"
              width={420}
              height={210}
              priority
              className="h-auto w-72 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_75%,transparent_100%)]"
            />
          </div>
          <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
            Subastas en vivo · México
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((category) => (
            <span
              key={category.name}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground/80"
            >
              <span className={category.color}>{category.emoji}</span>
              {category.name}
            </span>
          ))}
        </div>

        <LiveTicker count={liveSellerCount} />

        <div className="flex w-full flex-col gap-3">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 w-full gap-2 bg-gold text-gold-foreground hover:bg-gold/90",
            )}
          >
            <LogIn className="h-4 w-4" />
            Iniciar Sesión
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 w-full gap-2 border-gold text-gold hover:bg-gold/10",
            )}
          >
            <UserPlus className="h-4 w-4" />
            Crear Cuenta Nueva
          </Link>
          <ContactDialog />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Al continuar aceptas nuestros{" "}
          <Link href="/terms" className="text-gold underline underline-offset-2">
            Términos
          </Link>{" "}
          y{" "}
          <Link href="/privacy" className="text-gold underline underline-offset-2">
            Privacidad
          </Link>
        </p>
      </div>
    </div>
  );
}
