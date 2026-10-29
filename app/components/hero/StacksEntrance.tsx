import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

// How long (in scroll) the stacks stay pinned while they emerge from the dark.
const EMERGE = "45vh";

// The section after the hero. It overlaps the last screen of the hero's scroll, invisible,
// while you walk through the doorway to the wall of covers. Once it reaches the top it's held
// in place by native `position: sticky` (no scroll-compensating transforms, so no jitter) and
// fades in over the covers over EMERGE of scrolling, then scrolls on like any other section.
export function StacksEntrance({ children }: { children: ReactNode }) {
  const emergeRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: emergeRef, offset: ["start start", "end start"] });
  // Brightens quickly at first, so the dark of the doorway doesn't linger.
  // Never fully 0 (0.004 is below one colour step, so it can't be seen over the hall): Chrome
  // skips painting invisible content, and then had to paint the whole
  // library in one go the moment it appeared (a visible hitch at the handoff). It also never
  // toggles pointer-events, which restyled every element in the library mid-scroll.
  const opacity = useTransform(scrollYProgress, (v) => Math.max(0.004, 1 - (1 - v) ** 2));

  if (reduced) {
    return (
      <div className="relative z-10">
        <div id="enter-stacks" />
        {children}
      </div>
    );
  }

  return (
    <div className="relative z-10 mt-[-100vh]">
      {/* Scroll span over which the stacks emerge; "Enter the stacks" lands at its end. */}
      <div ref={emergeRef} aria-hidden className="pointer-events-none absolute inset-x-0 top-0" style={{ height: EMERGE }} />
      <div id="enter-stacks" aria-hidden className="absolute inset-x-0" style={{ top: EMERGE }} />
      {/* will-change: the fade is then done by the GPU instead of repainting the whole library */}
      <motion.div className="sticky top-0" style={{ opacity, willChange: "opacity" }}>
        {children}
      </motion.div>
      <div aria-hidden style={{ height: EMERGE }} />
    </div>
  );
}
