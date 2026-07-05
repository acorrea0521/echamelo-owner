import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StreamThumbnailGrid, type StreamCardData } from "@/components/home/StreamThumbnailGrid";
import { createClient } from "@/lib/supabase/server";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const { data: liveStreams } = await supabase
    .from("streams")
    .select(
      "id, title, viewer_count, seller:profiles!streams_seller_id_fkey(display_name, username, followers_count, category_id), current_listing:listings!streams_current_listing_fk(title, image_urls)",
    )
    .eq("status", "live")
    .order("created_at", { ascending: false });

  const streamCards: StreamCardData[] = (liveStreams ?? [])
    .filter((stream) => stream.seller?.category_id === category.id)
    .map((stream) => ({
      id: stream.id,
      title: stream.current_listing?.title ?? stream.title,
      thumbnailUrl: stream.current_listing?.image_urls?.[0] ?? "",
      isLive: true,
      viewerCount: stream.viewer_count,
      seller: {
        displayName: stream.seller?.display_name ?? stream.seller?.username ?? "Vendedor",
        followersCount: stream.seller?.followers_count ?? 0,
      },
    }));

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center gap-3 px-4">
        <Link
          href="/categories"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-foreground/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-bold">{category.name}</h1>
      </div>

      {streamCards.length > 0 ? (
        <StreamThumbnailGrid streams={streamCards} />
      ) : (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No hay transmisiones en vivo en esta categoría por ahora.
        </p>
      )}
    </div>
  );
}
