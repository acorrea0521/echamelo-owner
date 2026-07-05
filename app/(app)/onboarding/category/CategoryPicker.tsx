"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string };

export function CategoryPicker({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({ category_id: selected }).eq("id", user.id);

    setLoading(false);
    router.push("/onboarding/seller-application");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelected(category.id)}
            className={cn(
              "rounded-2xl border p-4 text-sm font-medium transition-colors",
              selected === category.id
                ? "brand-gradient border-transparent text-white"
                : "border-border bg-surface text-foreground/80",
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <Button disabled={!selected || loading} onClick={handleContinue}>
        {loading ? "Guardando..." : "Continuar"}
      </Button>
    </div>
  );
}
