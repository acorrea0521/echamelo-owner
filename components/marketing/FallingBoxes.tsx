import { Package } from "lucide-react";

// Deterministic pseudo-random spread so server and client render the same
// markup (avoids hydration mismatches) while still looking organic.
const BOXES = Array.from({ length: 18 }, (_, i) => {
  const left = (i * 37) % 100;
  const size = 12 + ((i * 13) % 14);
  const duration = 9 + ((i * 7) % 10);
  const delay = -((i * 3.3) % duration);
  const opacity = 0.25 + ((i * 5) % 30) / 100;
  return { id: i, left, size, duration, delay, opacity };
});

export function FallingBoxes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {BOXES.map((box) => (
        <Package
          key={box.id}
          className="animate-fall-box absolute top-0 text-[#b08968]"
          style={{
            left: `${box.left}%`,
            width: box.size,
            height: box.size,
            opacity: box.opacity,
            animationDuration: `${box.duration}s`,
            animationDelay: `${box.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
