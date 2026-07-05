"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// "Seguir" also functions as favoriting the seller — a single action, not
// two separate concepts (see project_echamelo_business_rules). Writes
// directly to the `follows` table via RLS (users manage their own rows);
// profiles.followers_count/following_count stay in sync via a DB trigger.
export function FollowButton({
  sellerId,
  initialFollowing,
  size = "sm",
}: {
  sellerId: string;
  initialFollowing: boolean;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", sellerId);
      setFollowing(false);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, followee_id: sellerId });
      setFollowing(true);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      size={size}
      onClick={toggle}
      disabled={loading}
      variant={following ? "outline" : "default"}
      className={cn("gap-1", size === "sm" && "h-6 shrink-0 rounded-full px-3 text-[11px]")}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        following && <Heart className="h-3 w-3 fill-current" />
      )}
      {following ? "Siguiendo" : "Seguir"}
    </Button>
  );
}
