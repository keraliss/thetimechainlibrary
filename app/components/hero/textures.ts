import { BITCOIN_PATH } from "~/components/ui/BitcoinMark";
import { mulberry32 } from "~/lib/random";

// SVG markup for the hall's painted surfaces (bookcases, the far wall). gl/glTextures.ts
// rasterizes these into canvases once and hands them to WebGL as textures.

const svgDoc = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none">${body}</svg>`;

export const svgUri = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

const SPINES = ["#6b2323", "#24452f", "#26345e", "#6e4a1c", "#4a2560", "#7a3216", "#33401f", "#5a2333", "#3a3550", "#8a6a2a"];

// A bookcase bay: rows of spines of varying height, shelf boards, uprights.
export function bookcaseSvg(seed: number, w: number, h: number) {
  const rand = mulberry32(seed);
  const rows = 7;
  const parts = [`<rect width="${w}" height="${h}" fill="#1a110c"/>`];
  for (let r = 0; r < rows; r++) {
    const top = (r * h) / rows + 6;
    const bot = ((r + 1) * h) / rows - 8;
    let x = 18;
    while (x < w - 18) {
      const sw = 7 + rand() * 12;
      if (rand() < 0.04) {
        x += sw * 2; // a gap on the shelf
        continue;
      }
      const sh = (bot - top) * (0.58 + rand() * 0.36);
      const fill = SPINES[Math.floor(rand() * SPINES.length)];
      parts.push(`<rect x="${x.toFixed(1)}" y="${(bot - sh).toFixed(1)}" width="${(sw - 1).toFixed(1)}" height="${sh.toFixed(1)}" fill="${fill}"/>`);
      if (rand() < 0.45) {
        parts.push(`<rect x="${x.toFixed(1)}" y="${(bot - sh + 6).toFixed(1)}" width="${(sw - 1).toFixed(1)}" height="1.4" fill="#c9973f" opacity=".7"/>`);
        parts.push(`<rect x="${x.toFixed(1)}" y="${(bot - 9).toFixed(1)}" width="${(sw - 1).toFixed(1)}" height="1.4" fill="#c9973f" opacity=".7"/>`);
      }
      x += sw;
    }
    parts.push(`<rect x="0" y="${bot.toFixed(1)}" width="${w}" height="9" fill="#3d2616"/><rect x="0" y="${bot.toFixed(1)}" width="${w}" height="1.5" fill="#6b4520"/>`);
  }
  parts.push(`<rect width="16" height="${h}" fill="#2b1b10"/><rect x="${w - 16}" width="16" height="${h}" fill="#2b1b10"/>`);
  return svgDoc(w, h, parts.join(""));
}

// The rose window: a ring of 21 blocks linked into a chain, ₿ at the centre.
function roseWindowSvg(cx: number, cy: number, r: number) {
  const R = 92;
  const n = 21;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(a) * R * 0.74, y: Math.sin(a) * R * 0.74, deg: (a * 180) / Math.PI };
  });
  const spokes = pts.map((p) => `<line x1="0" y1="0" x2="${p.x}" y2="${p.y}" stroke="#2a1608" stroke-width="2.5"/>`).join("");
  const chain = pts.map((p, i) => { const q = pts[(i + 1) % n]; return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="#ffcf7a" stroke-width="1.6" opacity=".8"/>`; }).join("");
  const blocks = pts.map((p) => `<rect x="${p.x - 6}" y="${p.y - 6}" width="12" height="12" rx="1.5" fill="#ffb347" stroke="#2a1608" stroke-width="1.5" transform="rotate(${p.deg + 90} ${p.x} ${p.y})"/>`).join("");
  return `<g transform="translate(${cx} ${cy}) scale(${r / R})">
    <circle r="${R * 2.1}" fill="url(#halo)"/>
    <circle r="${R + 6}" fill="#140b06" stroke="#b77a34" stroke-width="3"/>
    <circle r="${R}" fill="url(#glass)"/>${spokes}${chain}${blocks}
    <circle r="${R * 0.3}" fill="#ffd994" stroke="#2a1608" stroke-width="2.5"/>
    <path d="${BITCOIN_PATH}" fill-rule="evenodd" fill="#5a2c08" transform="translate(-18 -18) scale(1.5) rotate(14 12 12)"/>
    <circle r="${R}" fill="none" stroke="#2a1608" stroke-width="3"/>
  </g>`;
}

const pointedArch = (xl: number, xr: number, spring: number, apex: number, floor: number) => {
  const w = xr - xl;
  const h = spring - apex;
  const xm = (xl + xr) / 2;
  return `M ${xl} ${floor} L ${xl} ${spring} C ${xl} ${spring - h * 0.55} ${xm - w * 0.18} ${apex + h * 0.12} ${xm} ${apex} C ${xm + w * 0.18} ${apex + h * 0.12} ${xr} ${spring - h * 0.55} ${xr} ${spring} L ${xr} ${floor} Z`;
};

// The end of the hall: stone wall, bookcases either side, the doorway, the rose window above.
// The doorway in the far wall (SVG path in wall coordinates). glTextures cuts it out so you
// can see, and walk, into the room behind.
export const doorPath = (w: number, h: number, doorTop: number) => pointedArch(w / 2 - 170, w / 2 + 170, doorTop + 140, doorTop, h);

export function farWallSvg(w: number, h: number, doorTop: number, roseY: number, roseR: number, shelfH: number, bookcases: [string, string]) {
  const door = doorPath(w, h, doorTop);
  return svgDoc(
    w,
    h,
    `<defs>
      <pattern id="stones" width="120" height="60" patternUnits="userSpaceOnUse">
        <rect width="120" height="60" fill="#191115"/>
        <path d="M0 0H120M0 30H120M60 0V30M0 30V60M120 30V60" stroke="#0b0709" stroke-width="2"/>
      </pattern>
      <radialGradient id="wallGlow" cx="50%" cy="33%" r="60%">
        <stop offset="0%" stop-color="#f7931a" stop-opacity=".28"/><stop offset="100%" stop-color="#f7931a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="doorDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0b090d"/><stop offset="100%" stop-color="#050406"/></linearGradient>
      <radialGradient id="halo"><stop offset="0%" stop-color="#f7931a" stop-opacity=".55"/><stop offset="45%" stop-color="#f7931a" stop-opacity=".12"/><stop offset="100%" stop-color="#f7931a" stop-opacity="0"/></radialGradient>
      <radialGradient id="glass"><stop offset="0%" stop-color="#fff1cf"/><stop offset="40%" stop-color="#f7a43a"/><stop offset="85%" stop-color="#b4520f"/><stop offset="100%" stop-color="#5e2a08"/></radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#stones)"/>
    <rect width="${w}" height="${h}" fill="url(#wallGlow)"/>
    <image href="${svgUri(bookcases[0])}" x="120" y="${h - shelfH}" width="480" height="${shelfH}" preserveAspectRatio="none"/>
    <image href="${svgUri(bookcases[1])}" x="${w - 600}" y="${h - shelfH}" width="480" height="${shelfH}" preserveAspectRatio="none"/>
    <path d="${door}" fill="url(#doorDark)" stroke="#6b4520" stroke-width="10"/>
    ${roseWindowSvg(w / 2, roseY, roseR)}`,
  );
}
