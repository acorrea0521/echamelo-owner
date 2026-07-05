"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResend() {
    if (!email) return;
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
        <MailCheck className="h-6 w-6 text-primary" />
      </div>
      <h1 className="text-xl font-bold">Revisa tu correo</h1>
      <p className="text-sm text-muted-foreground">
        Te enviamos un enlace de verificación. Haz clic en él para activar tu cuenta — no podrás
        iniciar sesión hasta confirmarlo.
      </p>
      <p className="text-xs text-muted-foreground">
        ¿No lo ves? Revisa también tu carpeta de spam.
      </p>

      <div className="mt-2 flex w-full flex-col gap-2">
        <Input
          type="email"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button variant="secondary" onClick={handleResend} disabled={status === "sending"}>
          {status === "sending" ? "Enviando..." : "Reenviar correo de verificación"}
        </Button>
        {status === "sent" && (
          <p className="text-xs text-muted-foreground">Enviado — revisa tu correo de nuevo.</p>
        )}
        {status === "error" && (
          <p className="text-xs text-destructive">
            No se pudo reenviar. Inténtalo de nuevo en unos momentos.
          </p>
        )}
      </div>
    </div>
  );
}
