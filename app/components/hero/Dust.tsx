import type { CSSProperties } from "react";
import { mulberry32 } from "~/lib/random";

const MOTES = (() => {
  const rand = mulberry32(840000);
  return Array.from({ length: 48 }, () => ({
    left: rand() * 100,
    top: 40 + rand() * 60,
    size: 1 + rand() * 2.2,
    duration: 12 + rand() * 14,
    delay: -rand() * 26,
    dx: `${(rand() - 0.5) * 120}px`,
  }));
})();

// Specks of dust drifting up through the candlelight.
export function Dust({ count }: { count: number }) {
  return (
    <>
      {MOTES.slice(0, count).map((m, i) => (
        <span
          key={i}
          className="mote absolute rounded-full bg-[#ffdca0]"
          style={
            {
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: m.size,
              height: m.size,
              boxShadow: "0 0 6px #ffc46b",
              animationDuration: `${m.duration}s`,
              animationDelay: `${m.delay}s`,
              "--dx": m.dx,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}
