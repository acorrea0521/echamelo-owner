"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Store, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthTopBar } from "@/components/auth/AuthTopBar";
import { UsernameField } from "@/components/auth/UsernameField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Role = "buyer" | "seller";

const ROLE_CARDS: {
  id: Role;
  title: string;
  description: string;
  tags: string[];
  icon: typeof ShoppingCart;
  accent: "gold" | "primary";
}[] = [
  {
    id: "buyer",
    title: "Comprador",
    description: "Participa en subastas en vivo, sigue a vendedores y gana productos increíbles.",
    tags: ["Gratis", "Pago seguro"],
    icon: ShoppingCart,
    accent: "gold",
  },
  {
    id: "seller",
    title: "Vendedor",
    description: "Crea tu canal, transmite en vivo y vende mediante subastas en tiempo real.",
    tags: ["Canal propio", "Live cuando quieras"],
    icon: Store,
    accent: "primary",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "form">("role");
  const [role, setRole] = useState<Role | null>(null);
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!usernameAvailable) {
      setError("Elige un nombre de usuario disponible.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { role, username: username.trim().toLowerCase() },
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/verify-email");
  }

  if (step === "role") {
    return (
      <div className="flex flex-col gap-6">
        <AuthTopBar />

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">
            ¿Cómo quieres participar en <span className="text-primary">¡ECHAMELO!</span>?
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {ROLE_CARDS.map(({ id, title, description, tags, icon: Icon, accent }) => (
            <button
              key={id}
              onClick={() => {
                setRole(id);
                setStep("form");
              }}
              className={cn(
                "flex items-center gap-4 rounded-2xl border bg-surface p-4 text-left transition-colors",
                accent === "gold" ? "border-gold/40 hover:border-gold" : "border-primary/40 hover:border-primary",
              )}
            >
              <div
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
                  accent === "gold" ? "bg-gold/15 text-gold" : "bg-primary/15 text-primary",
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="font-bold">{title}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
                <div className="flex gap-1.5 pt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        accent === "gold"
                          ? "border-gold/40 text-gold"
                          : "border-primary/40 text-primary",
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-gold">
            Inicia sesión
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthTopBar onBack={() => setStep("role")} />

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Te registras como{" "}
          <span className="font-semibold text-foreground">
            {role === "seller" ? "Vendedor" : "Comprador"}
          </span>
          .
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <UsernameField
          value={username}
          onChange={setUsername}
          onAvailabilityChange={setUsernameAvailable}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          disabled={loading || !usernameAvailable}
          className="mt-2 h-11 bg-gold text-gold-foreground hover:bg-gold/90"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>
    </div>
  );
}
