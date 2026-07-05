import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const REQUIRED_FIELDS = [
  "legal_full_name",
  "date_of_birth",
  "residence_state",
  "rfc_number",
  "rfc_document_url",
] as const;

function isAdult(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
  return dob <= eighteenYearsAgo;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data: application } = await supabase
    .from("seller_applications")
    .select("*")
    .eq("seller_id", user.id)
    .single();

  if (!application) {
    return NextResponse.json({ error: "No se encontró tu solicitud." }, { status: 404 });
  }
  if (!["draft", "changes_requested"].includes(application.status)) {
    return NextResponse.json({ error: "Tu solicitud ya fue enviada." }, { status: 409 });
  }

  for (const field of REQUIRED_FIELDS) {
    if (!application[field]) {
      return NextResponse.json({ error: `Falta completar: ${field}.` }, { status: 400 });
    }
  }
  if (!isAdult(application.date_of_birth!)) {
    return NextResponse.json({ error: "Debes ser mayor de edad para vender." }, { status: 400 });
  }
  if (application.inventory_photo_urls.length < 3) {
    return NextResponse.json(
      { error: "Sube al menos 3 fotos reales de tu inventario." },
      { status: 400 },
    );
  }
  if (!application.pitch_video_url) {
    return NextResponse.json({ error: "Sube tu video de presentación." }, { status: 400 });
  }
  if (application.stripe_identity_status !== "verified") {
    return NextResponse.json(
      { error: "Debes verificar tu identidad antes de enviar tu solicitud." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("seller_applications")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("seller_id", user.id);

  if (error) {
    return NextResponse.json({ error: "No se pudo enviar tu solicitud." }, { status: 500 });
  }

  await supabase.from("profiles").update({ seller_status: "solicitud_pendiente" }).eq("id", user.id);

  return NextResponse.json({ ok: true });
}
