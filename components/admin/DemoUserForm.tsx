"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

export function DemoUserForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [role, setRole] = useState<"buyer" | "seller">("seller");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setCreated(null);

    const response = await fetch("/api/admin/demo-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role,
        username,
        displayName,
        password,
        categoryId: role === "seller" ? categoryId : null,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "No se pudo crear la cuenta.");
      return;
    }

    setCreated(payload.username);
    setUsername("");
    setDisplayName("");
    setPassword("");
    router.refresh();
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground";

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex gap-2">
        {(["seller", "buyer"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRole(option)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-xs font-semibold",
              role === option
                ? "bg-gold text-gold-foreground"
                : "bg-surface-2 text-muted-foreground hover:text-foreground",
            )}
          >
            {option === "seller" ? "Vendedor" : "Comprador"}
          </button>
        ))}
      </div>

      <input
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="Nombre de usuario"
        autoComplete="off"
        className={inputClass}
      />
      <input
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        placeholder="Nombre visible (opcional)"
        autoComplete="off"
        className={inputClass}
      />
      <input
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Contraseña (mínimo 8 caracteres)"
        type="text"
        autoComplete="off"
        className={inputClass}
      />

      {role === "seller" && (
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className={inputClass}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {created && (
        <p className="text-xs text-gold">
          Cuenta <strong>{created}</strong> creada. Entra en /login con ese usuario y su contraseña.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-gold text-sm font-semibold text-gold-foreground disabled:opacity-50"
      >
        <UserPlus className="h-4 w-4" />
        {saving ? "Creando..." : "Crear cuenta demo"}
      </button>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        La contraseña se muestra en claro a propósito: es la que le vas a dictar a la persona y no
        hay forma de recuperarla después. Anótala antes de crear la cuenta.
      </p>
    </form>
  );
}
