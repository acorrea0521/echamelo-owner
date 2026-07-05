import { ArrowLeft, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AvatarUploadButton } from "@/components/profile/AvatarUploadButton";

export function ProfileHeader({
  displayName,
  username,
  bio,
  posts,
  following,
  followers,
  showBack,
  isOwnProfile = true,
  userId,
  avatarUrl,
}: {
  displayName: string;
  username: string;
  bio: string;
  posts: number;
  following: number;
  followers: number;
  showBack?: boolean;
  isOwnProfile?: boolean;
  userId?: string;
  avatarUrl?: string | null;
}) {
  return (
    <div className="flex flex-col">
      <div className="brand-gradient relative h-28 w-full">
        {showBack && (
          <Link
            href="/home"
            className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 px-4">
        <div className="relative -mt-10">
          <Avatar className="h-20 w-20 border-4 border-background">
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-surface-2 text-lg font-semibold">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isOwnProfile && userId && <AvatarUploadButton userId={userId} />}
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">{displayName}</h1>
          {!isOwnProfile && (
            <Button size="sm" className="h-7 rounded-full px-4 text-xs">
              Seguir
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">@{username}</p>
        <p className="max-w-xs text-center text-sm text-foreground/80">{bio}</p>

        <div className="mt-2 flex w-full items-center justify-around border-y border-border py-3">
          <Stat label="Publicaciones" value={posts} />
          <Stat label="Siguiendo" value={following} />
          <Stat label="Seguidores" value={followers} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-base font-bold">{value.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
