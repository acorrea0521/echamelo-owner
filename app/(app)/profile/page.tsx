import { notFound } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, followers_count, following_count, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) notFound();

  const { count: postsCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", user.id);

  return (
    <div className="flex flex-col gap-5">
      <ProfileHeader
        displayName={profile.display_name ?? profile.username}
        username={profile.username}
        bio={profile.bio ?? ""}
        posts={postsCount ?? 0}
        following={profile.following_count}
        followers={profile.followers_count}
        isOwnProfile
        userId={user.id}
        avatarUrl={profile.avatar_url}
      />
      <ProfileTabs />
    </div>
  );
}
