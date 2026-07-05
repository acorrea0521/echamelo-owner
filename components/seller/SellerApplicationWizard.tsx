"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2, ImagePlus, X, Video, ShieldCheck, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadSellerApplicationFile } from "@/lib/supabase/storage";
import { MX_STATES } from "@/lib/mx-states";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LinksEditor, type LinkEntry } from "./LinksEditor";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const STORE_PLATFORMS = [
  { value: "mercado_libre", label: "Mercado Libre" },
  { value: "amazon_mx", label: "Amazon México" },
  { value: "facebook_marketplace", label: "FB Marketplace" },
  { value: "instagram_shopping", label: "Instagram Shopping" },
];

const SOCIAL_PLATFORMS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
];

const SALES_RANGES = [
  { value: "0_5k", label: "Hasta $5,000 MXN" },
  { value: "5k_20k", label: "$5,000 – $20,000 MXN" },
  { value: "20k_50k", label: "$20,000 – $50,000 MXN" },
  { value: "50k_plus", label: "Más de $50,000 MXN" },
];

const RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;

type Application = {
  status: string;
  legal_full_name: string | null;
  date_of_birth: string | null;
  residence_state: string | null;
  external_store_links: LinkEntry[];
  social_media_links: LinkEntry[];
  estimated_monthly_sales_range: string | null;
  inventory_photo_urls: string[];
  pitch_video_url: string | null;
  rfc_number: string | null;
  rfc_document_url: string | null;
  stripe_identity_status: string | null;
  rejected_reason: string | null;
  admin_notes: string | null;
};

const STEPS = ["Datos generales", "Tu tienda", "Evidencia", "Fiscal e identidad"];

export function SellerApplicationWizard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<Application | null>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/seller-application")
      .then((res) => res.json())
      .then((body) => {
        setApp(body.application);
        setLoading(false);
      });
  }, []);

  async function saveStep(patch: Partial<Application>) {
    setError(null);
    setSaving(true);
    const res = await fetch("/api/seller-application", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const body = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(body.error ?? "No se pudo guardar.");
      return false;
    }
    setApp(body.application);
    return true;
  }

  if (loading || !app) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (app.status === "submitted" || app.status === "in_review") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center">
        <ShieldCheck className="h-10 w-10 text-gold" />
        <h2 className="text-base font-bold">Tu solicitud está en revisión</h2>
        <p className="text-sm text-muted-foreground">
          Nuestro equipo revisará tu información, fotos y video. Te avisaremos en cuanto tengamos
          una respuesta.
        </p>
        <Button onClick={() => router.push("/home")} className="mt-2">
          Volver al inicio
        </Button>
      </div>
    );
  }

  if (app.status === "approved") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary" />
        <h2 className="text-base font-bold">¡Tu solicitud fue aprobada!</h2>
        <Button onClick={() => router.push("/onboarding/stripe")} className="mt-2">
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {app.status === "changes_requested" && app.rejected_reason && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs text-gold">
          <strong className="block font-semibold">Se requieren cambios:</strong>
          {app.rejected_reason}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "h-1 flex-1 rounded-full",
              i <= step ? "bg-primary" : "bg-surface-2",
            )}
          />
        ))}
      </div>
      <h2 className="text-sm font-semibold text-foreground/90">{STEPS[step]}</h2>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {step === 0 && (
        <StepGeneral
          app={app}
          setApp={setApp}
          onNext={async () => {
            const ok = await saveStep({
              legal_full_name: app.legal_full_name,
              date_of_birth: app.date_of_birth,
              residence_state: app.residence_state,
            });
            if (ok) setStep(1);
          }}
        />
      )}

      {step === 1 && (
        <StepStore
          app={app}
          setApp={setApp}
          onBack={() => setStep(0)}
          onNext={async () => {
            const ok = await saveStep({
              external_store_links: app.external_store_links,
              social_media_links: app.social_media_links,
              estimated_monthly_sales_range: app.estimated_monthly_sales_range,
            });
            if (ok) setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <StepEvidence
          app={app}
          setApp={setApp}
          onBack={() => setStep(1)}
          onNext={async () => {
            const ok = await saveStep({
              inventory_photo_urls: app.inventory_photo_urls,
              pitch_video_url: app.pitch_video_url,
            });
            if (ok) setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <StepFiscalIdentity
          app={app}
          setApp={setApp}
          saveStep={saveStep}
          onBack={() => setStep(2)}
          saving={saving}
        />
      )}
    </div>
  );
}

function StepGeneral({
  app,
  setApp,
  onNext,
}: {
  app: Application;
  setApp: (a: Application) => void;
  onNext: () => void;
}) {
  const valid = app.legal_full_name && app.date_of_birth && app.residence_state;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Nombre completo (igual que tu identificación oficial)</Label>
        <Input
          value={app.legal_full_name ?? ""}
          onChange={(e) => setApp({ ...app, legal_full_name: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Fecha de nacimiento</Label>
        <Input
          type="date"
          value={app.date_of_birth ?? ""}
          onChange={(e) => setApp({ ...app, date_of_birth: e.target.value })}
        />
        <p className="text-[11px] text-muted-foreground">Debes ser mayor de 18 años.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Estado de residencia</Label>
        <select
          value={app.residence_state ?? ""}
          onChange={(e) => setApp({ ...app, residence_state: e.target.value })}
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">Selecciona un estado</option>
          {MX_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-muted-foreground">Debes residir en México.</p>
      </div>
      <Button disabled={!valid} onClick={onNext} className="h-11">
        Continuar
      </Button>
    </div>
  );
}

function StepStore({
  app,
  setApp,
  onBack,
  onNext,
}: {
  app: Application;
  setApp: (a: Application) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <LinksEditor
        label="Tiendas externas (Mercado Libre, Amazon, Facebook Marketplace, IG Shopping)"
        value={app.external_store_links}
        onChange={(v) => setApp({ ...app, external_store_links: v })}
        platforms={STORE_PLATFORMS}
      />
      <LinksEditor
        label="Redes sociales"
        value={app.social_media_links}
        onChange={(v) => setApp({ ...app, social_media_links: v })}
        platforms={SOCIAL_PLATFORMS}
      />
      <div className="flex flex-col gap-1.5">
        <Label>Ventas mensuales estimadas</Label>
        <div className="grid grid-cols-2 gap-2">
          {SALES_RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setApp({ ...app, estimated_monthly_sales_range: r.value })}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-xs font-medium",
                app.estimated_monthly_sales_range === r.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="h-11 flex-1">
          Atrás
        </Button>
        <Button disabled={!app.estimated_monthly_sales_range} onClick={onNext} className="h-11 flex-1">
          Continuar
        </Button>
      </div>
    </div>
  );
}

function StepEvidence({
  app,
  setApp,
  onBack,
  onNext,
}: {
  app: Application;
  setApp: (a: Application) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  async function handlePhotos(files: FileList | null) {
    if (!files) return;
    setUploadingPhotos(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const toUpload = Array.from(files).slice(0, 5 - app.inventory_photo_urls.length);
    const urls = await Promise.all(toUpload.map((f) => uploadSellerApplicationFile(user.id, f)));
    setApp({ ...app, inventory_photo_urls: [...app.inventory_photo_urls, ...urls] });
    setUploadingPhotos(false);
  }

  function removePhoto(path: string) {
    setApp({ ...app, inventory_photo_urls: app.inventory_photo_urls.filter((p) => p !== path) });
  }

  function checkVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => reject(new Error("No se pudo leer el video."));
      video.src = URL.createObjectURL(file);
    });
  }

  async function handleVideo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setVideoError(null);

    const duration = await checkVideoDuration(file).catch(() => null);
    if (duration === null) {
      setVideoError("No se pudo leer el video.");
      return;
    }
    if (duration < 30 || duration > 60) {
      setVideoError(`El video debe durar entre 30 y 60 segundos (dura ${Math.round(duration)}s).`);
      return;
    }

    setUploadingVideo(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const path = await uploadSellerApplicationFile(user.id, file);
    setApp({ ...app, pitch_video_url: path });
    setUploadingVideo(false);
  }

  const valid = app.inventory_photo_urls.length >= 3 && app.pitch_video_url;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Fotos reales de tu inventario (3 a 5, sin capturas de pantalla)</Label>
        <div className="flex flex-wrap gap-2">
          {app.inventory_photo_urls.map((path) => (
            <div key={path} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-surface-2">
              <button
                type="button"
                onClick={() => removePhoto(path)}
                className="absolute right-0.5 top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          {app.inventory_photo_urls.length < 5 && (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhotos}
              className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground"
            >
              {uploadingPhotos ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            </button>
          )}
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handlePhotos(e.target.files)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Video de presentación (30–60 segundos, tú hablando a cámara)</Label>
        {app.pitch_video_url ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs">
            <Video className="h-4 w-4 text-primary" />
            Video cargado
            <button
              type="button"
              onClick={() => setApp({ ...app, pitch_video_url: null })}
              className="ml-auto text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploadingVideo}
            className="flex h-16 items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground"
          >
            {uploadingVideo ? <Loader2 className="h-5 w-5 animate-spin" /> : <Video className="h-5 w-5" />}
            {uploadingVideo ? "Subiendo..." : "Subir video"}
          </button>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleVideo(e.target.files)}
        />
        {videoError && <p className="text-xs text-destructive">{videoError}</p>}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="h-11 flex-1">
          Atrás
        </Button>
        <Button disabled={!valid} onClick={onNext} className="h-11 flex-1">
          Continuar
        </Button>
      </div>
    </div>
  );
}

function StepFiscalIdentity({
  app,
  setApp,
  saveStep,
  onBack,
  saving,
}: {
  app: Application;
  setApp: (a: Application) => void;
  saveStep: (patch: Partial<Application>) => Promise<boolean>;
  onBack: () => void;
  saving: boolean;
}) {
  const router = useRouter();
  const rfcInputRef = useRef<HTMLInputElement>(null);
  const [uploadingRfc, setUploadingRfc] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const rfcValid = app.rfc_number ? RFC_PATTERN.test(app.rfc_number) : false;
  const identityVerified = app.stripe_identity_status === "verified";

  async function handleRfcDoc(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploadingRfc(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const path = await uploadSellerApplicationFile(user.id, file);
    setApp({ ...app, rfc_document_url: path });
    setUploadingRfc(false);
  }

  async function handleVerifyIdentity() {
    setVerifying(true);
    await saveStep({ rfc_number: app.rfc_number, rfc_document_url: app.rfc_document_url });

    const stripe = await stripePromise;
    const res = await fetch("/api/stripe/identity/session", { method: "POST" });
    const { clientSecret } = await res.json();
    if (!stripe || !clientSecret) {
      setVerifying(false);
      return;
    }

    const { error } = await stripe.verifyIdentity(clientSecret);
    setVerifying(false);
    if (!error) {
      // Webhook drives the final "verified" status; poll once for a quick UI update.
      const check = await fetch("/api/seller-application").then((r) => r.json());
      setApp(check.application);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    const ok = await saveStep({ rfc_number: app.rfc_number, rfc_document_url: app.rfc_document_url });
    if (!ok) {
      setSubmitting(false);
      return;
    }
    const res = await fetch("/api/seller-application/submit", { method: "POST" });
    const body = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(body.error ?? "No se pudo enviar tu solicitud.");
      return;
    }
    router.push("/onboarding/seller-application");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>RFC (Constancia de Situación Fiscal)</Label>
        <Input
          value={app.rfc_number ?? ""}
          onChange={(e) => setApp({ ...app, rfc_number: e.target.value.toUpperCase() })}
          placeholder="XXXX000000XXX"
          maxLength={13}
        />
        {app.rfc_number && !rfcValid && (
          <p className="text-[11px] text-destructive">Formato de RFC inválido.</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Documento de RFC</Label>
        {app.rfc_document_url ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs">
            Documento cargado
            <button
              type="button"
              onClick={() => setApp({ ...app, rfc_document_url: null })}
              className="ml-auto text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => rfcInputRef.current?.click()}
            disabled={uploadingRfc}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground"
          >
            {uploadingRfc ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subir documento"}
          </button>
        )}
        <input
          ref={rfcInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => handleRfcDoc(e.target.files)}
        />
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className={cn("h-4 w-4", identityVerified ? "text-primary" : "text-muted-foreground")} />
          <span className="text-sm font-medium">Verificación de identidad</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Necesitamos tu INE o pasaporte y una selfie para confirmar que eres tú.
        </p>
        {identityVerified ? (
          <span className="text-xs font-semibold text-primary">Identidad verificada ✓</span>
        ) : (
          <Button
            type="button"
            onClick={handleVerifyIdentity}
            disabled={verifying || !rfcValid}
            className="h-9 w-fit text-xs"
          >
            {verifying ? "Verificando..." : "Verificar identidad"}
          </Button>
        )}
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="h-11 flex-1">
          Atrás
        </Button>
        <Button
          disabled={!rfcValid || !app.rfc_document_url || !identityVerified || submitting || saving}
          onClick={handleSubmit}
          className="h-11 flex-1 bg-gold text-gold-foreground hover:bg-gold/90"
        >
          {submitting ? "Enviando..." : "Enviar solicitud"}
        </Button>
      </div>
    </div>
  );
}
