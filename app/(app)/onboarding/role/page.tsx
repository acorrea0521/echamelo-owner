"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ROLES = [
  {
    id: "buyer" as const,
    title: "Comprador",
    description: "Mira subastas en vivo, chatea y puja por artículos.",
    icon: ShoppingBag,
  },
  {
    id: "seller" as const,
    title: "Vendedor",
    description: "Transmite en vivo y subasta tus propios productos.",
    icon: Radio,
  },
];

export default function RoleOnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<"buyer" | "seller" | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({ role: selected }).eq("id", user.id);

    setLoading(false);
    router.push(selected === "seller" ? "/onboarding/category" : "/home");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <div className="flex flex-col gap-1 text-center">
        <span className="text-lg font-black tracking-tight text-primary">¡ECHAMELO!</span>
        <h1 className="text-xl font-bold">¿Cómo usarás ECHAMELO?</h1>
        <p className="text-sm text-muted-foreground">
          Podrás cambiar esto más tarde en configuración.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {ROLES.map(({ id, title, description, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
              selected === id ? "border-primary bg-surface" : "border-border bg-surface/50",
            )}
          >
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                selected === id ? "brand-gradient" : "bg-surface-2",
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold">{title}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </div>
          </button>
        ))}
      </div>

      <Button disabled={!selected || loading} onClick={handleContinue}>
        {loading ? "Guardando..." : "Continuar"}
      </Button>
    </div>
  );
}
