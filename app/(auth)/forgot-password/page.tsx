import { AuthTopBar } from "@/components/auth/AuthTopBar";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <AuthTopBar backHref="/login" />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
        <p className="text-sm text-muted-foreground">Próximamente.</p>
      </div>
    </div>
  );
}
