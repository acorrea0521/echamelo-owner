"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AuthTopBar } from "@/components/auth/AuthTopBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const body = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "No se pudo iniciar sesión.");
      return;
    }
    router.push("/home");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthTopBar />

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">¡Bienvenido de vuelta!</h1>
        <p className="text-sm text-muted-foreground">Ingresa tus credenciales para entrar</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Usuario o correo
          </Label>
          <Input
            id="email"
            type="text"
            required
            placeholder="usuario o correo@ejemplo.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Contraseña
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Link href="/forgot-password" className="self-end text-xs font-medium text-gold">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 bg-gold text-gold-foreground hover:bg-gold/90"
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="font-semibold text-gold">
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
}
