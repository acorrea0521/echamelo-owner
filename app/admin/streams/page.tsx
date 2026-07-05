import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ForceStopButton } from "@/components/admin/ForceStopButton";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Programada",
  live: "En vivo",
  ended: "Finalizada",
};

export default async function AdminStreamsPage() {
  const admin = createAdminClient();

  const { data: streams } = await admin
    .from("streams")
    .select("id, title, status, viewer_count, created_at, seller:profiles!streams_seller_id_fkey(username)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold">Transmisiones</h1>

      <div className="flex flex-col gap-2">
        {(streams ?? []).map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <Link href={`/stream/${s.id}`} className="truncate text-sm font-semibold hover:underline">
                {s.title}
              </Link>
              <span className="text-xs text-muted-foreground">
                @{s.seller?.username} · {s.viewer_count} espectadores
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  s.status === "live" ? "bg-live text-white" : "bg-surface-2 text-muted-foreground",
                )}
              >
                {STATUS_LABELS[s.status]}
              </span>
              {s.status === "live" && <ForceStopButton streamId={s.id} />}
            </div>
          </div>
        ))}
        {(!streams || streams.length === 0) && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sin transmisiones.
          </p>
        )}
      </div>
    </div>
  );
}
