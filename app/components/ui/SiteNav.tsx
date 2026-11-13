import { motion } from "motion/react";
import { Link } from "react-router";
import { leaveStacks } from "~/lib/stacksMode";
import { BitcoinMark } from "./BitcoinMark";

// Shown once you're in the stacks and on book pages. The logo takes you home, to the top of the hall.
export function SiteNav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-x-0 top-0 z-50 border-b border-gold/15 bg-night/95"
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-8">
        <Link
          to="/"
          onClick={(event) => {
            if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) leaveStacks();
          }}
          className="flex items-center gap-2 font-heading text-xs tracking-[0.2em] text-parchment uppercase transition-colors hover:text-candle focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:text-sm"
        >
          <BitcoinMark className="h-6 w-6 text-ember" />
          The Timechain Library
        </Link>
      </nav>
    </motion.header>
  );
}
