export function LiveTicker({ count }: { count: number }) {
  const text =
    count > 0
      ? `${count} ${count === 1 ? "vendedor" : "vendedores"} en vivo ahora mismo...`
      : "Vendedores en vivo ahora mismo...";

  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      <p className="truncate text-sm text-primary/90">{text}</p>
    </div>
  );
}
