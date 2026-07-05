import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewActions } from "@/components/admin/ReviewActions";

const SALES_LABELS: Record<string, string> = {
  "0_5k": "Hasta $5,000 MXN",
  "5k_20k": "$5,000 – $20,000 MXN",
  "20k_50k": "$20,000 – $50,000 MXN",
  "50k_plus": "Más de $50,000 MXN",
};

export default async function SellerReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: application } = await admin
    .from("seller_applications")
    .select("*, seller:profiles!seller_applications_seller_id_fkey(username, display_name)")
    .eq("id", id)
    .single();

  if (!application) notFound();

  const paths = [
    ...application.inventory_photo_urls,
    ...(application.pitch_video_url ? [application.pitch_video_url] : []),
    ...(application.rfc_document_url ? [application.rfc_document_url] : []),
  ];
  const { data: signed } = paths.length
    ? await admin.storage.from("seller-applications").createSignedUrls(paths, 60 * 10)
    : { data: [] };
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  const photoUrls = application.inventory_photo_urls
    .map((p: string) => urlByPath.get(p))
    .filter(Boolean) as string[];
  const videoUrl = application.pitch_video_url ? urlByPath.get(application.pitch_video_url) : null;
  const rfcUrl = application.rfc_document_url ? urlByPath.get(application.rfc_document_url) : null;

  const nameMismatch =
    application.identity_extracted_name &&
    application.legal_full_name &&
    application.identity_extracted_name.trim().toLowerCase() !==
      application.legal_full_name.trim().toLowerCase();

  return (
    <div className="flex flex-col gap-5 pb-24">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/sellers"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-base font-semibold">
            {application.legal_full_name ?? application.seller?.display_name}
          </h1>
          <span className="text-xs text-muted-foreground">@{application.seller?.username}</span>
        </div>
      </div>

      <Section title="Datos generales">
        <Field label="Nombre legal" value={application.legal_full_name} />
        <Field label="Fecha de nacimiento" value={application.date_of_birth} />
        <Field label="Estado de residencia" value={application.residence_state} />
        <Field
          label="Ventas mensuales estimadas"
          value={application.estimated_monthly_sales_range ? SALES_LABELS[application.estimated_monthly_sales_range] : null}
        />
      </Section>

      <Section title="Identidad (Stripe Identity)">
        <Field label="Estado" value={application.stripe_identity_status} />
        <Field label="Nombre extraído por Stripe" value={application.identity_extracted_name} />
        {nameMismatch && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
            El nombre declarado no coincide con el nombre extraído del documento.
          </p>
        )}
      </Section>

      <Section title="Fiscal">
        <Field label="RFC" value={application.rfc_number} />
        {rfcUrl && (
          <a
            href={rfcUrl}
            target="_blank"
            rel="noreferrer"
            className="flex w-fit items-center gap-1.5 text-xs font-semibold text-primary"
          >
            Ver documento de RFC <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </Section>

      <Section title="Tiendas externas y redes">
        <LinkList items={application.external_store_links as LinkItem[]} />
        <LinkList items={application.social_media_links as LinkItem[]} />
      </Section>

      <Section title="Evidencia de inventario">
        {photoUrls.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin fotos.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {photoUrls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                className="h-24 w-24 rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Video de presentación">
        {videoUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={videoUrl} controls className="w-full rounded-lg border border-border" />
        ) : (
          <p className="text-xs text-muted-foreground">Sin video.</p>
        )}
      </Section>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-3xl border-t border-border bg-background p-4">
        <ReviewActions applicationId={application.id} status={application.status} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-foreground/90">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

type LinkItem = { platform: string; url: string };

function LinkList({ items }: { items: LinkItem[] }) {
  if (!items || items.length === 0) return <p className="text-xs text-muted-foreground">Ninguno.</p>;
  return (
    <div className="flex flex-col gap-1">
      {items.map((item, i) => (
        <a
          key={i}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary"
        >
          {item.platform}: {item.url} <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ))}
    </div>
  );
}
