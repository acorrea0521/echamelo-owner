import Link from "next/link";
import { StoryAvatarRow, type StoryStreamer } from "@/components/home/StoryAvatarRow";
import { CategoryPills } from "@/components/home/CategoryPills";
import { StreamThumbnailGrid, type StreamCardData } from "@/components/home/StreamThumbnailGrid";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: liveStreams }, { data: sellers }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, icon").order("sort_order"),
    supabase
      .from("streams")
      .select(
        "id, title, viewer_count, status, seller:profiles!streams_seller_id_fkey(display_name, username, followers_count), current_listing:listings!streams_current_listing_fk(title, image_urls)",
      )
      .eq("status", "live")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .eq("role", "seller")
      .order("followers_count", { ascending: false })
      .limit(10),
  ]);

  const liveSellerIds = new Set((liveStreams ?? []).map((s) => s.seller?.username));

  const storyStreamers: StoryStreamer[] = (sellers ?? []).map((seller) => ({
    id: seller.id,
    displayName: seller.display_name ?? seller.username,
    avatarUrl: seller.avatar_url ?? "",
    isLive: liveSellerIds.has(seller.username),
  }));

  const streamCards: StreamCardData[] = (liveStreams ?? []).map((stream) => ({
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
    <div className="flex flex-col gap-5">
      {storyStreamers.length > 0 && <StoryAvatarRow streamers={storyStreamers} />}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-sm font-semibold text-foreground/90">Categorías</h2>
          <Link href="/categories" className="text-xs font-medium text-primary">
            Ver todas
          </Link>
        </div>
        <CategoryPills categories={categories ?? []} />
      </div>

      {streamCards.length > 0 ? (
        <StreamThumbnailGrid streams={streamCards} />
      ) : (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No hay transmisiones en vivo en este momento.
        </p>
      )}
    </div>
  );
}
