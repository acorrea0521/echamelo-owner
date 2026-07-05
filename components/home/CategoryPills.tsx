"use client";

import { useState } from "react";
import { Flame, Gamepad2, Smartphone, Flower2, Gem, Shirt, type LucideIcon } from "lucide-react";
import type { MockCategory } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  flame: Flame,
  "gamepad-2": Gamepad2,
  smartphone: Smartphone,
  "flower-2": Flower2,
  gem: Gem,
  shirt: Shirt,
};

export function CategoryPills({ categories }: { categories: MockCategory[] }) {
  const [activeId, setActiveId] = useState(categories[0]?.id);

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {categories.map((category) => {
        const Icon = ICONS[category.icon] ?? Flame;
        const active = category.id === activeId;
        return (
          <button
            key={category.id}
            onClick={() => setActiveId(category.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
              active
                ? "brand-gradient border-transparent text-white"
                : "border-border bg-surface text-foreground/80",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
