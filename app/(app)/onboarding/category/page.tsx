import { createClient } from "@/lib/supabase/server";
import { CategoryPicker } from "./CategoryPicker";

export default async function CategoryOnboardingPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <div className="flex flex-col gap-1 text-center">
        <span className="text-lg font-black tracking-tight text-primary">¡ECHAMELO!</span>
        <h1 className="text-xl font-bold">¿Qué vas a vender?</h1>
        <p className="text-sm text-muted-foreground">
          Elige una categoría — la necesitarás antes de poder transmitir en vivo.
        </p>
      </div>

      <CategoryPicker categories={categories ?? []} />
    </div>
  );
}
