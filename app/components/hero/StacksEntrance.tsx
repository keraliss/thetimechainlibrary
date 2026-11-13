import { useLayoutEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { enterStacks } from "~/lib/stacksMode";

// How long (in scroll) the stacks stay pinned while they emerge from the dark.
const EMERGE = "45vh";

// The section after the hero. It overlaps the last screen of the hero's scroll, invisible,
// while you walk through the doorway to the wall of covers. Once it reaches the top it's held
// in place by native `position: sticky` (no scroll-compensating transforms, so no jitter) and
// fades in over the covers over EMERGE of scrolling, then scrolls on like any other section.
//
// Once you're fully in (the stacks at the top of the screen), the home page drops the hall
// (`locked`): this becomes a plain section and the scroll is moved so nothing on screen jumps.
// The library stays mounted in the same place in the tree throughout, so it isn't rebuilt.
export function StacksEntrance({ locked, children }: { locked: boolean; children: ReactNode }) {
  const emergeRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const walk = !reduced && !locked;
  const { scrollYProgress } = useScroll({ target: emergeRef, offset: ["start start", "end start"] });
  // Brightens quickly at first, so the dark of the doorway doesn't linger.
  // Never fully 0 (0.004 is below one colour step, so it can't be seen over the hall): Chrome
  // skips painting invisible content, and then had to paint the whole
  // library in one go the moment it appeared (a visible hitch at the handoff). It also never
  // toggles pointer-events, which restyled every element in the library mid-scroll.
  const opacity = useTransform(scrollYProgress, (v) => Math.max(0.004, 1 - (1 - v) ** 2));

  // The wall of covers looks like the destination, so people stopped there and clicked the
  // covers (landing on the invisible library on top). Until the stacks show, a layer over them
  // takes the click and walks you in (the "keep scrolling" plaque is in the Hero). Its
  // pointer-events flip on this one element only, so nothing in the library is restyled.
  const catcher = useRef<HTMLButtonElement>(null);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (catcher.current) catcher.current.style.pointerEvents = v < 0.25 ? "auto" : "none";
  });

  // In once the "Enter the stacks" mark reaches the top of the screen. Remember where the
  // library sits on screen so the switch can keep it there.
  const anchor = useRef<number | null>(null);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", () => {
    if (locked || !enterRef.current || !contentRef.current) return;
    if (enterRef.current.getBoundingClientRect().top > 1) return;
    anchor.current = contentRef.current.getBoundingClientRect().top;
    enterStacks();
  });
  useLayoutEffect(() => {
    if (!locked || anchor.current == null || !contentRef.current) return;
    window.scrollBy({ top: contentRef.current.getBoundingClientRect().top - anchor.current, behavior: "instant" });
    anchor.current = null;
  }, [locked]);

  return (
    <div className={`relative z-10 ${walk ? "mt-[-100vh]" : ""}`}>
      {/* Scroll span over which the stacks emerge; "Enter the stacks" lands at its end. */}
      <div ref={emergeRef} aria-hidden className="pointer-events-none absolute inset-x-0 top-0" style={{ height: walk ? EMERGE : 0 }} />
      <div ref={enterRef} id="enter-stacks" aria-hidden className="absolute inset-x-0" style={{ top: walk ? EMERGE : 0 }} />
      {walk && (
        <button
          ref={catcher}
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => document.getElementById("enter-stacks")?.scrollIntoView({ behavior: "smooth" })}
          className="sticky top-0 z-20 -mb-[100vh] block h-screen w-full cursor-pointer"
        />
      )}
      {/* will-change: the fade is then done by the GPU instead of repainting the whole library */}
      <motion.div ref={contentRef} className={walk ? "sticky top-0" : undefined} style={walk ? { opacity, willChange: "opacity" } : undefined}>
        {children}
      </motion.div>
      {walk && <div aria-hidden style={{ height: EMERGE }} />}
    </div>
  );
}
