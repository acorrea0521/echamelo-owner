import Link from "next/link";
import { Eye } from "lucide-react";

export type StreamCardData = {
  id: string;
  title: string;
  thumbnailUrl: string;
  isLive: boolean;
  viewerCount: number;
  seller: {
    displayName: string;
    followersCount: number;
  };
};

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function StreamThumbnailGrid({ streams }: { streams: StreamCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {streams.map((stream) => (
        <Link
          key={stream.id}
          href={`/stream/${stream.id}`}
          className="group overflow-hidden rounded-2xl bg-surface"
        >
          <div className="relative aspect-[3/4] w-full bg-surface-2">
            {stream.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stream.thumbnailUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/70" />

            {stream.isLive && (
              <span className="absolute left-2 top-2 rounded-md bg-live px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                En vivo
              </span>
            )}
            {stream.isLive && (
              <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
                <Eye className="h-3 w-3" />
                {formatCount(stream.viewerCount)}
              </span>
            )}

            <div className="absolute inset-x-0 bottom-0 p-2.5">
              <p className="truncate text-sm font-semibold text-white">{stream.title}</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-2.5 py-2">
            <span className="truncate text-xs font-medium text-foreground/80">
              {stream.seller.displayName}
            </span>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatCount(stream.seller.followersCount)} seguidores
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
