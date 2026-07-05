"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type LinkEntry = { platform: string; url: string };

export function LinksEditor({
  value,
  onChange,
  platforms,
  label,
}: {
  value: LinkEntry[];
  onChange: (next: LinkEntry[]) => void;
  platforms: { value: string; label: string }[];
  label: string;
}) {
  function update(index: number, patch: Partial<LinkEntry>) {
    onChange(value.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...value, { platform: platforms[0].value, url: "" }]);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      {value.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={entry.platform}
            onChange={(e) => update(i, { platform: e.target.value })}
            className="h-9 shrink-0 rounded-lg border border-input bg-transparent px-2 text-xs"
          >
            {platforms.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <Input
            value={entry.url}
            onChange={(e) => update(i, { url: e.target.value })}
            placeholder="https://..."
            className="h-9 flex-1 text-xs"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={add}
        className="h-9 w-fit gap-1.5 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar enlace
      </Button>
    </div>
  );
}
