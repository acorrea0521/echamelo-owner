import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Enviada",
  in_review: "En revisión",
  changes_requested: "Cambios solicitados",
  approved: "Aprobada",
  rejected: "Rechazada",
  draft: "Borrador",
};

export default async function AdminSellersPage() {
  const admin = createAdminClient();

  const { data: applications } = await admin
    .from("seller_applications")
    .select("id, status, legal_full_name, submitted_at, seller:profiles!seller_applications_seller_id_fkey(username, display_name)")
    .in("status", ["submitted", "in_review"])
    .order("submitted_at", { ascending: true });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold">Solicitudes de vendedores</h1>

      {!applications || applications.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hay solicitudes pendientes.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {applications.map((app) => (
            <Link
              key={app.id}
              href={`/admin/sellers/${app.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">
                  {app.legal_full_name ?? app.seller?.display_name ?? app.seller?.username}
                </span>
                <span className="text-xs text-muted-foreground">@{app.seller?.username}</span>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  app.status === "submitted"
                    ? "bg-gold/15 text-gold"
                    : "bg-primary/15 text-primary",
                )}
              >
                {STATUS_LABELS[app.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
