import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/sellers", label: "Vendedores" },
  { href: "/admin/sellers/balances", label: "Saldos" },
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/streams", label: "Streams" },
  { href: "/admin/orders", label: "Órdenes" },
  { href: "/admin/moderation", label: "Moderación" },
  { href: "/admin/tickets", label: "Tickets" },
];

// middleware.ts already redirects non-admins away from /admin; this is the
// defense-in-depth re-check every admin route/page performs independently
// (see lib/supabase/admin.ts doc comment).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/home");

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="flex flex-col gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            aria-label="Salir del panel de administrador"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-foreground/80"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link href="/admin" className="text-sm font-black tracking-tight text-primary">
            ¡ECHAMELO! Admin
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
