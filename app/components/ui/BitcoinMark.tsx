// The ₿ symbol (public domain), drawn as a path so it looks the same everywhere: display fonts
// like Cinzel have no ₿ glyph. Tilted 14° like the Bitcoin logo. Uses currentColor.
const B =
  "M7 5H13.2C15.6 5 17 6.3 17 8.2C17 9.6 16.2 10.6 15 11.1C16.6 11.5 17.6 12.8 17.6 14.6C17.6 17.2 15.9 19 13.2 19H7Z" +
  "M9.6 7.2V10.2H12.8C13.9 10.2 14.5 9.6 14.5 8.7C14.5 7.8 13.9 7.2 12.8 7.2Z" +
  "M9.6 12.3V16.8H13C14.3 16.8 15 16 15 14.55C15 13.1 14.3 12.3 13 12.3Z" +
  "M9.4 2.6H10.9V5H9.4ZM12.3 2.6H13.8V5H12.3ZM9.4 19H10.9V21.4H9.4ZM12.3 19H13.8V21.4H12.3Z";

export function BitcoinMark({ className, tilt = true }: { className?: string; tilt?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={B} fillRule="evenodd" transform={tilt ? "rotate(14 12 12)" : undefined} />
    </svg>
  );
}

// The ₿ as a bare path for drawing inside another SVG (the rose window).
export const BITCOIN_PATH = B;

