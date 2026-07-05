import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export function AuthTopBar({
  onBack,
  backHref = "/",
}: {
  onBack?: () => void;
  backHref?: string;
}) {
  const BackTag = onBack ? "button" : Link;

  return (
    <div className="flex items-center gap-3 border-b border-border pb-4">
      <BackTag
        // @ts-expect-error -- href only applies to the Link case, onClick only to the button case
        href={onBack ? undefined : backHref}
        onClick={onBack}
        aria-label="Volver"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground/80"
      >
        <ArrowLeft className="h-4 w-4" />
      </BackTag>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-black">
        <Image
          src="/brand/logo.jpg"
          alt=""
          width={120}
          height={120}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 50%",
          }}
        />
      </div>
      <span className="text-2xl font-black tracking-tight text-primary">¡ECHAMELO!</span>
    </div>
  );
}
