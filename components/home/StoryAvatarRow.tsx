import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type StoryStreamer = {
  id: string;
  displayName: string;
  avatarUrl: string;
  isLive: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function StoryAvatarRow({ streamers }: { streamers: StoryStreamer[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-1 pt-4 [scrollbar-width:none]">
      {streamers.map((streamer) => (
        <div key={streamer.id} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
          <div
            className={cn(
              "rounded-full p-[2px]",
              streamer.isLive ? "brand-gradient" : "bg-surface-2",
            )}
          >
            <Avatar className="h-14 w-14 border-2 border-background">
              <AvatarImage src={streamer.avatarUrl} alt={streamer.displayName} />
              <AvatarFallback className="bg-surface-2 text-xs font-semibold">
                {initials(streamer.displayName)}
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="w-full truncate text-center text-xs text-foreground/80">
            {streamer.displayName}
          </span>
          {streamer.isLive && (
            <span className="rounded-full bg-live px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-white">
              En vivo
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
