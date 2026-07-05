"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/supabase/storage";

const MAX_BYTES = 5 * 1024 * 1024;

export function AvatarUploadButton({ userId }: { userId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecciona una imagen.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("La imagen debe pesar menos de 5 MB.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const publicUrl = await uploadAvatar(userId, file);
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);
      if (updateError) throw updateError;
      router.refresh();
    } catch {
      setError("No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="absolute -bottom-1 -right-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Cambiar foto de perfil"
        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground disabled:opacity-60"
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
      </button>
      {error && (
        <p className="absolute top-9 right-0 w-40 text-right text-[10px] text-destructive">{error}</p>
      )}
    </div>
  );
}
