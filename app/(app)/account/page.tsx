"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CreditCard,
  BadgeCheck,
  ShieldCheck,
  LogOut,
  Store,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading";

type Profile = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  buyer_status: string | null;
  stripe_payment_method_id: string | null;
  seller_status: string | null;
};

function Row({
  href,
  icon: Icon,
  label,
  subtitle,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  subtitle?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground/80">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{label}</span>
        {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, role, buyer_status, stripe_payment_method_id, seller_status")
        .eq("id", user.id)
        .single();

      setProfile(profileRow);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!profile) return <LoadingState className="py-24" />;

  const displayName = profile.display_name ?? profile.username;
  const isVerifiedBuyer = profile.buyer_status === "verificado";
  const hasSavedCard = !!profile.stripe_payment_method_id;
  const isSeller = profile.role === "seller";

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-surface-2 text-lg font-semibold">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1.5">
          <span className="text-lg font-bold">{displayName}</span>
          <Link href="/profile">
            <Button size="sm" variant="secondary" className="h-7 rounded-full px-4 text-xs">
              Ver perfil
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Row
          href="/account/payment"
          icon={CreditCard}
          label="Pago y envío"
          subtitle={hasSavedCard ? "Tarjeta guardada" : "Sin tarjeta guardada"}
        />
        <Row
          href="/account/verified-buyer"
          icon={BadgeCheck}
          label="Comprador verificado"
          subtitle={isVerifiedBuyer ? "Verificado" : "Sin verificar"}
        />
        {isSeller && <Row href="/earnings" icon={Store} label="Mis ganancias" />}
        <Row href="/account/security" icon={ShieldCheck} label="Seguridad de la cuenta" />
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left text-destructive"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/15">
          <LogOut className="h-4 w-4" />
        </span>
        <span className="text-sm font-medium">Cerrar sesión</span>
      </button>
    </div>
  );
}
