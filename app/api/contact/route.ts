import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const CONTACT_EMAIL = "a.correa2675@gmail.com";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "El envío de correo no está configurado todavía." },
      { status: 503 },
    );
  }

  const { name, email, message } = parsed.data;
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: "¡ECHAMELO! <onboarding@resend.dev>",
    to: CONTACT_EMAIL,
    replyTo: email,
    subject: `Mensaje de ${name} — ¡ECHAMELO!`,
    text: `${message}\n\n— ${name} (${email})`,
  });

  if (error) {
    return NextResponse.json({ error: "No se pudo enviar el mensaje." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
