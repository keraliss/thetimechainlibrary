import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { stats } from "~/lib/books";
import { Dust } from "./Dust";
import { WALK_DISTANCE } from "./gl/layout";

// three.js is big; load the hall after the page is up (the title shows over the dark meanwhile).
const HallGL = lazy(() => import("./gl/HallGL"));

function useIsSmallScreen() {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setSmall(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSmall(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return small;
}

// A screen-space layer that shifts against the pointer; deeper layers move less.
function Layer({ depth, px, py, children }: { depth: number; px: MotionValue<number>; py: MotionValue<number>; children: ReactNode }) {
  const x = useTransform(px, (v) => v * depth * -70);
  const y = useTransform(py, (v) => v * depth * -45);
  return (
    <motion.div className="absolute inset-[-5%]" style={{ x, y }}>
      {children}
    </motion.div>
  );
}

// Hero scroll progress at which the walk ends, in front of the wall of covers.
const WALK_END = 0.97; // keep moving right up to the hand-off, so there's no dead scroll
const smoothstep = (t: number) => t * t * (3 - 2 * t);

const rise = {
  hidden: { opacity: 0, y: 24 },
  shown: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 1.1, delay: 0.3 + i * 0.25, ease: [0.22, 1, 0.36, 1] as const } }),
};

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion() ?? false;
  const small = useIsSmallScreen();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const px = useSpring(pointerX, { stiffness: 40, damping: 18 });
  const py = useSpring(pointerY, { stiffness: 40, damping: 18 });

  // Scrolling walks you down the hall and through the doorway to a wall of covers; the
  // library page then fades in over it (see StacksEntrance). Progress runs over the span where the hall is
  // pinned, smoothed so wheel steps become a glide.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.5 });
  const cam = useTransform(progress, (p) => (reduced ? 0 : WALK_DISTANCE * smoothstep(Math.min(1, p / WALK_END))));
  const titleY = useTransform(scrollYProgress, [0, 0.15], [0, reduced ? 0 : -120]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  // Looking around follows the mouse anywhere in the window (the stacks overlap the end of
  // the walk, so a listener on this section alone would stop working there).
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointerX.set(e.clientX / window.innerWidth - 0.5);
      pointerY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, pointerX, pointerY]);

  return (
    <section ref={ref} className={`relative ${reduced ? "h-screen" : "h-[300vh]"}`} aria-label="The Timechain Library">
      <div className="sticky top-0 h-screen overflow-hidden bg-night">
        <Suspense fallback={null}>
          <HallGL cam={cam} small={small} lookX={px} lookY={py} candleCount={small ? 26 : 44} bookCount={small ? 5 : 8} reduced={reduced} />
        </Suspense>
        <Layer depth={1} px={px} py={py}>
          {!reduced && <Dust count={small ? 24 : 48} />}
        </Layer>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,transparent_40%,rgb(5_4_6/0.8)_100%)]" />

        <motion.div
          className="absolute inset-x-0 bottom-[12vh] flex flex-col items-center px-4 text-center sm:bottom-[14vh]"
          style={{ y: titleY, opacity: titleOpacity }}
        >
          <motion.p
            className="font-heading text-[11px] tracking-[0.3em] text-gold/80 uppercase sm:text-xs sm:tracking-[0.45em]"
            variants={rise}
            initial="hidden"
            animate="shown"
            custom={0}
          >
            <span className="whitespace-nowrap">Est. at the Genesis Block</span>
            <span className="hidden sm:inline"> · </span>
            <span className="block whitespace-nowrap sm:inline">3 January 2009</span>
          </motion.p>
          <motion.h1
            className="mt-4 bg-linear-to-b from-[#fff4dc] via-[#efd9a8] to-[#c8913f] bg-clip-text font-display text-5xl leading-[1.05] text-transparent drop-shadow-[0_0_28px_rgb(247_147_26/0.35)] sm:text-7xl lg:text-8xl"
            variants={rise}
            initial="hidden"
            animate="shown"
            custom={1}
          >
            The Timechain
            <br />
            Library
          </motion.h1>
          <motion.p
            className="mt-5 max-w-xl text-lg text-balance text-parchment/85 italic sm:text-2xl"
            variants={rise}
            initial="hidden"
            animate="shown"
            custom={2}
          >
            Every book ever written about Bitcoin, gathered in one hall.
          </motion.p>
          <motion.p
            className="mt-4 font-heading text-xs tracking-[0.25em] text-parchment/60 uppercase sm:text-sm"
            variants={rise}
            initial="hidden"
            animate="shown"
            custom={3}
          >
            <span className="whitespace-nowrap">{stats.count} volumes</span> ·{" "}
            <span className="whitespace-nowrap">{stats.free} free to read</span>
            <span className="hidden sm:inline"> · </span>
            <span className="block whitespace-nowrap sm:inline">
              {stats.firstYear}–{stats.lastYear}
            </span>
          </motion.p>
          <motion.a
            href="#enter-stacks"
            className="group mt-9 border border-gold/60 bg-black/30 px-8 py-3 font-heading text-xs tracking-[0.35em] text-parchment uppercase backdrop-blur-sm transition hover:border-candle hover:bg-ember/10 hover:shadow-[0_0_32px_rgb(247_147_26/0.35)] sm:text-sm"
            variants={rise}
            initial="hidden"
            animate="shown"
            custom={4}
          >
            Enter the stacks
            <span className="ml-3 inline-block transition group-hover:translate-y-0.5">↓</span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
