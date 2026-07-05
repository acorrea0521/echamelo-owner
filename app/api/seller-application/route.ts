import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/database.types";

// Fetches (creating an empty draft row on first touch) or updates the
// caller's own seller_applications row. Only editable while status is
// 'draft' or 'changes_requested' — enforced by RLS, not re-checked here.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let { data: application } = await supabase
    .from("seller_applications")
    .select("*")
    .eq("seller_id", user.id)
    .maybeSingle();

  if (!application) {
    const { data: created, error } = await supabase
      .from("seller_applications")
      .insert({ seller_id: user.id })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: "No se pudo crear la solicitud." }, { status: 500 });
    }
    application = created;
  }

  return NextResponse.json({ application });
}

const EDITABLE_FIELDS = [
  "legal_full_name",
  "date_of_birth",
  "residence_state",
  "external_store_links",
  "social_media_links",
  "estimated_monthly_sales_range",
  "inventory_photo_urls",
  "pitch_video_url",
  "rfc_number",
  "rfc_document_url",
] as const;

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const update: TablesUpdate<"seller_applications"> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  const { data, error } = await supabase
    .from("seller_applications")
    .update(update)
    .eq("seller_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "No se pudo guardar tu solicitud." }, { status: 400 });
  }

  return NextResponse.json({ application: data });
}
