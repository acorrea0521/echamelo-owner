import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns the application plus short-lived signed URLs for its private
// storage files (seller-applications bucket) — admin-only.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: application } = await adminClient
    .from("seller_applications")
    .select("*, seller:profiles!seller_applications_seller_id_fkey(username, display_name)")
    .eq("id", id)
    .single();

  if (!application) {
    return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  }

  const paths = [
    ...application.inventory_photo_urls,
    ...(application.pitch_video_url ? [application.pitch_video_url] : []),
    ...(application.rfc_document_url ? [application.rfc_document_url] : []),
  ];

  const { data: signed } = await adminClient.storage
    .from("seller-applications")
    .createSignedUrls(paths, 60 * 10);

  const urlByPath = new Map(signed?.map((s) => [s.path, s.signedUrl]) ?? []);

  return NextResponse.json({
    application: {
      ...application,
      inventory_photo_signed_urls: application.inventory_photo_urls
        .map((p: string) => urlByPath.get(p))
        .filter(Boolean),
      pitch_video_signed_url: application.pitch_video_url
        ? urlByPath.get(application.pitch_video_url)
        : null,
      rfc_document_signed_url: application.rfc_document_url
        ? urlByPath.get(application.rfc_document_url)
        : null,
    },
  });
}
