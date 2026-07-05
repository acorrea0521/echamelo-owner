import { createClient } from "@/lib/supabase/server";
import { CategoriesLayout } from "@/components/categories/CategoriesLayout";
import { EchameloCSSProvider } from "@/components/stream/EchameloCSSProvider";

export default async function CategoriesPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: liveStreams }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, icon").order("sort_order"),
    supabase
      .from("streams")
      .select("viewer_count, seller:profiles!streams_seller_id_fkey(category_id)")
      .eq("status", "live"),
  ]);

  const viewersByCategory = new Map<string, number>();
  for (const stream of liveStreams ?? []) {
    const categoryId = stream.seller?.category_id;
    if (!categoryId) continue;
    viewersByCategory.set(categoryId, (viewersByCategory.get(categoryId) ?? 0) + stream.viewer_count);
  }

  const categoriesWithViewers = (categories ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    viewerCount: viewersByCategory.get(cat.id) ?? 0,
  }));

  return (
    <EchameloCSSProvider>
      <CategoriesLayout categories={categoriesWithViewers} />
    </EchameloCSSProvider>
  );
}
