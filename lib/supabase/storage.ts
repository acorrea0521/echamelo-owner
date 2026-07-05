import { createClient } from "@/lib/supabase/client";

// Uploads under <bucket>/<user_id>/<filename> per the storage RLS policies
// in supabase/migrations/0003_storage_buckets.sql.
export async function uploadListingImage(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("listing-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("listing-images").getPublicUrl(path);
  return publicUrl;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  // Cache-bust so the new image shows immediately everywhere it's rendered.
  return `${publicUrl}?t=${Date.now()}`;
}

// seller-applications is a private bucket (RFC/inventory/video are sensitive) —
// returns the storage path, not a public URL. Signed URLs are generated on
// demand for viewing (see lib/stripe... no, see the admin review route).
export async function uploadSellerApplicationFile(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("seller-applications").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  return path;
}
