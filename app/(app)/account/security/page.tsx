"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AccountSecurityPage() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentEmail(data.user?.email ?? "");
    });
  }, []);

  async function handleEmailChange() {
    if (!newEmail.trim()) return;
    setEmailSaving(true);
    setEmailStatus(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailSaving(false);
    setEmailStatus(
      error ? "No se pudo actualizar el correo." : "Revisa tu bandeja de entrada para confirmar el cambio.",
    );
    if (!error) setNewEmail("");
  }

  async function handlePasswordChange() {
    if (newPassword.length < 8) {
      setPasswordStatus("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setPasswordSaving(true);
    setPasswordStatus(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    setPasswordStatus(error ? "No se pudo actualizar la contraseña." : "Contraseña actualizada.");
    if (!error) setNewPassword("");
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <div className="flex items-center gap-3">
        <Link
          href="/account"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-foreground/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-bold">Seguridad de la cuenta</h1>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
        <span className="text-sm font-semibold">Correo electrónico</span>
        <p className="text-xs text-muted-foreground">Actual: {currentEmail}</p>
        <Input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          type="email"
          placeholder="nuevo@correo.com"
          className="h-10"
        />
        {emailStatus && <p className="text-xs text-muted-foreground">{emailStatus}</p>}
        <Button onClick={handleEmailChange} disabled={emailSaving || !newEmail.trim()} className="h-10">
          {emailSaving ? "Guardando..." : "Actualizar correo"}
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
        <span className="text-sm font-semibold">Contraseña</span>
        <Input
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          placeholder="Nueva contraseña"
          className="h-10"
        />
        {passwordStatus && <p className="text-xs text-muted-foreground">{passwordStatus}</p>}
        <Button onClick={handlePasswordChange} disabled={passwordSaving || !newPassword} className="h-10">
          {passwordSaving ? "Guardando..." : "Actualizar contraseña"}
        </Button>
      </div>
    </div>
  );
}
