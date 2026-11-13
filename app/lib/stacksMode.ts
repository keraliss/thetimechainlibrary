import { useSyncExternalStore } from "react";

// Once you've walked into the stacks, the hall is gone: the home page shows only the library
// (under the navbar), so scrolling up can't take you back. The logo is the way home. Kept at
// module level so it survives a trip to a book page and back.
let inStacks = false;
const listeners = new Set<() => void>();

function set(value: boolean) {
  if (inStacks === value) return;
  inStacks = value;
  listeners.forEach((listener) => listener());
}

export function enterStacks() {
  set(true);
}

// Back to the top of the hall. Scroll first, so the hall doesn't mount mid-way down and walk
// you straight back in.
export function leaveStacks() {
  window.scrollTo({ top: 0, behavior: "instant" });
  set(false);
}

export function useInStacks() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => inStacks,
    () => false,
  );
}
