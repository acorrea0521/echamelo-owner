import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FollowButton } from "@/components/profile/FollowButton";
import { cn } from "@/lib/utils";

export function StreamHeader({
  displayName,
  followersCount,
  viewerCount,
  isLive,
  sellerId,
  showFollow,
  initialFollowing,
}: {
  displayName: string;
  followersCount: number;
  viewerCount: number;
  isLive: boolean;
  sellerId: string;
  showFollow: boolean;
  initialFollowing: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 p-3">
      <Link
        href="/home"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="flex flex-1 items-center gap-2 rounded-full bg-black/40 py-1 pl-1 pr-3 backdrop-blur">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-surface-2 text-[10px] font-semibold">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-xs font-semibold text-white">{displayName}</span>
          <span className="text-[10px] text-white/70">
            {followersCount.toLocaleString()} seguidores
          </span>
        </div>
        {showFollow && (
          <div className="ml-1">
            <FollowButton sellerId={sellerId} initialFollowing={initialFollowing} />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 rounded-full bg-black/40 px-2.5 py-1.5 backdrop-blur">
        <Eye className="h-3.5 w-3.5 text-white" />
        <span className="text-xs font-medium text-white">{viewerCount.toLocaleString()}</span>
        <span
          className={cn(
            "ml-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase text-white",
            isLive ? "bg-live" : "bg-white/20",
          )}
        >
          {isLive ? "En vivo" : "Finalizado"}
        </span>
      </div>
    </div>
  );
}
