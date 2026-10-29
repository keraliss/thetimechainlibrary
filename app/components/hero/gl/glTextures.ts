import * as THREE from "three";
import { BITCOIN_PATH } from "~/components/ui/BitcoinMark";
import { books } from "~/lib/books";
import { bookcaseSvg, doorPath, farWallSvg, svgUri } from "../textures";
import {
  APEX,
  BAYS,
  ARCH_H,
  ARCH_TOP,
  ARCH_W,
  BOOK_COVERS,
  BOOK_H,
  BOOK_W,
  CANDLE_HEIGHTS,
  CANDLE_TOP,
  CANDLE_W,
  COVER_WALL,
  DOOR_TOP,
  HW,
  SHELF_H,
  SPRING,
  STEP,
  candleBoxH,
} from "./layout";

// Everything the hall shows is painted once into canvases, then handed to the GPU as textures.

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.round(w);
  c.height = Math.round(h);
  return [c, c.getContext("2d")!] as const;
}

async function svgCanvas(svg: string, scale: number) {
  const img = new Image();
  img.src = svgUri(svg);
  await img.decode();
  const [c, ctx] = canvas(img.naturalWidth * scale, img.naturalHeight * scale);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return [c, ctx] as const;
}

function texture(c: HTMLCanvasElement, opts: { repeatY?: number } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (opts.repeatY) {
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, opts.repeatY);
  }
  return t;
}

// ---------- surfaces ----------

async function bookcase(seed: number) {
  const [c, ctx] = await svgCanvas(bookcaseSvg(seed, STEP, SHELF_H), 1.5);
  // Shade the top and bottom of the shelves: candlelight falls on the middle.
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, "rgb(8 6 8 / 0.8)");
  g.addColorStop(0.22, "rgb(8 6 8 / 0.05)");
  g.addColorStop(0.7, "rgb(8 6 8 / 0.15)");
  g.addColorStop(1, "rgb(8 6 8 / 0.7)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  return texture(c);
}

// One bay's worth of floor: stone flags, and the red runner with its gold borders.
function floorTile() {
  const s = 2;
  const [c, ctx] = canvas(HW * 2 * s, STEP * s);
  const w = c.width;
  const h = c.height;
  ctx.fillStyle = "#2a2024";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#0e0a0c";
  for (let y = 128 * s; y < h; y += 131 * s) ctx.fillRect(0, y, w, 3 * s);
  for (let x = 177 * s; x < w; x += 180 * s) ctx.fillRect(x, 0, 3 * s, h);
  ctx.fillStyle = "#4c1212";
  ctx.fillRect(w * 0.34, 0, w * 0.32, h);
  ctx.fillStyle = "#b48a3c";
  for (const [a, b] of [[0.34, 0.345], [0.355, 0.36], [0.64, 0.645], [0.655, 0.66]]) ctx.fillRect(w * a, 0, w * (b - a), h);
  return c;
}

const archD = (xl: number, xr: number, spring: number, apex: number, floor: number) => {
  const w = xr - xl;
  const h = spring - apex;
  const xm = (xl + xr) / 2;
  return `M ${xl} ${floor} L ${xl} ${spring} C ${xl} ${spring - h * 0.55} ${xm - w * 0.18} ${apex + h * 0.12} ${xm} ${apex} C ${xm + w * 0.18} ${apex + h * 0.12} ${xr} ${spring - h * 0.55} ${xr} ${spring} L ${xr} ${floor}`;
};

// A stone rib spanning the hall on two pillars (transparent everywhere else).
function archSvg() {
  const d = archD(100, 100 + HW * 2, SPRING - ARCH_TOP, APEX - ARCH_TOP, ARCH_H);
  const caps = [100, 100 + HW * 2]
    .map((x) => `<rect x="${x - 58}" y="${SPRING - ARCH_TOP - 10}" width="116" height="22" fill="#2a1d18" stroke="#9a6a36" stroke-opacity=".45" stroke-width="2"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ARCH_W} ${ARCH_H}" width="${ARCH_W}" height="${ARCH_H}">
    <path d="${d}" fill="none" stroke="#0c080a" stroke-width="96"/>
    <path d="${d}" fill="none" stroke="#1d1418" stroke-width="70"/>
    <path d="${d}" fill="none" stroke="#9a6a36" stroke-opacity=".5" stroke-width="3"/>${caps}</svg>`;
}

// Light falling from the rose window: a soft trapezoid, brighter at the top.
function shaftCanvas() {
  const [c, ctx] = canvas(512, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "rgb(255 196 107 / 0.22)");
  g.addColorStop(1, "rgb(255 196 107 / 0.02)");
  ctx.fillStyle = g;
  ctx.filter = "blur(10px)";
  ctx.beginPath();
  ctx.moveTo(512 * 0.43, 0);
  ctx.lineTo(512 * 0.57, 0);
  ctx.lineTo(512, 512);
  ctx.lineTo(0, 512);
  ctx.fill();
  return c;
}

function radialCanvas(size: number, stops: [number, string][]) {
  const [c, ctx] = canvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

// ---------- candles ----------

// The wax body of a candle (the flame is a separate sprite so it can flicker).
function candleBodySvg(height: number, drips: number) {
  const W = CANDLE_W;
  const top = CANDLE_TOP;
  const H = candleBoxH(height);
  const dr = [
    { x: 8, len: 10 + height * 14 },
    { x: 18, len: 6 + height * 9 },
    { x: 13, len: 16 + height * 10 },
  ].slice(0, drips);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs>
      <linearGradient id="wax" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#a8916a"/><stop offset=".35" stop-color="#f7edd6"/><stop offset=".6" stop-color="#efe2c4"/><stop offset="1" stop-color="#8f7a57"/></linearGradient>
      <linearGradient id="lit" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffd38a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd38a" stop-opacity="0"/></linearGradient>
    </defs>
    <path d="M4 ${top + 3} Q ${W / 2} ${top - 1} ${W - 4} ${top + 3} L ${W - 4} ${H - 2} Q ${W / 2} ${H + 1} 4 ${H - 2} Z" fill="url(#wax)"/>
    <path d="M4 ${top + 3} Q ${W / 2} ${top - 1} ${W - 4} ${top + 3} L ${W - 4} ${top + 22} L 4 ${top + 22} Z" fill="url(#lit)"/>
    <ellipse cx="${W / 2}" cy="${top + 3}" rx="${W / 2 - 4}" ry="2.6" fill="#fff6e2"/>
    <ellipse cx="${W / 2}" cy="${top + 3.4}" rx="${W / 2 - 7}" ry="1.4" fill="#f2d9a8"/>
    ${dr.map((d) => `<path d="M${d.x - 1.6} ${top + 2} L ${d.x - 1.6} ${top + d.len} Q ${d.x} ${top + d.len + 3.2} ${d.x + 1.6} ${top + d.len} L ${d.x + 1.6} ${top + 2} Z" fill="#f9f0dc"/>`).join("")}
    <path d="M${W / 2} ${top + 2} q 0.8 -3 -0.4 -6" stroke="#2a1a10" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  </svg>`;
}

// The flame alone, in a 28x30 box with its base at the bottom.
function flameSvg() {
  const W = CANDLE_W;
  const b = CANDLE_TOP;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${b}" width="${W}" height="${b}">
    <defs><radialGradient id="f" cx=".5" cy=".72" r=".62"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#fff3c4"/><stop offset=".55" stop-color="#ffc35a"/><stop offset=".85" stop-color="#ff7a1a" stop-opacity=".85"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="${W / 2}" cy="${b - 7}" rx="2.2" ry="2.6" fill="#5a8cff" opacity=".55"/>
    <path d="M${W / 2} ${b - 28} C ${W / 2 + 3} ${b - 19} ${W / 2 + 6.5} ${b - 13} ${W / 2 + 6.5} ${b - 9} A 6.5 6.5 0 0 1 ${W / 2 - 6.5} ${b - 9} C ${W / 2 - 6.5} ${b - 13} ${W / 2 - 3} ${b - 19} ${W / 2} ${b - 28} Z" fill="url(#f)"/>
  </svg>`;
}

// ---------- books ----------

const bitcoin = new Path2D(BITCOIN_PATH);

// Half a hardcover: leather colour, a double gold rule, a ₿ medallion.
function coverCanvas(color: string) {
  const s = 3;
  const w = BOOK_W / 2;
  const h = BOOK_H;
  const [c, ctx] = canvas(w * s, h * s);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "rgb(0 0 0 / 0.35)");
  g.addColorStop(0.6, "rgb(0 0 0 / 0)");
  g.addColorStop(1, "rgb(255 220 160 / 0.08)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgb(217 164 65 / 0.75)";
  ctx.lineWidth = 1;
  ctx.strokeRect(4.5, 4.5, w - 9, h - 9);
  ctx.strokeStyle = "rgb(217 164 65 / 0.35)";
  ctx.strokeRect(8.5, 8.5, w - 17, h - 17);
  ctx.strokeStyle = "rgb(217 164 65 / 0.85)";
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((14 * Math.PI) / 180);
  ctx.scale(17 / 24, 17 / 24);
  ctx.translate(-12, -12);
  ctx.fillStyle = "rgb(230 180 80 / 0.95)";
  ctx.fill(bitcoin, "evenodd");
  ctx.restore();
  return c;
}

function pagesCanvas() {
  const [c, ctx] = canvas(64, 64);
  for (let y = 0; y < 64; y += 2) {
    ctx.fillStyle = y % 4 === 0 ? "#efe3c6" : "#d9c9a4";
    ctx.fillRect(0, y, 64, 2);
  }
  return c;
}

// ---------- the inscription ----------

export const INSCRIPTION_ASPECT = 2560 / 720;

// "Your one-stop library / for every Bitcoin book", in the site's fonts, gold with a glow,
// over a thin rule with a ₿. Waits for the web fonts so the canvas doesn't fall back to serif.
async function inscriptionCanvas() {
  await Promise.all([document.fonts.load('600 90px "Cinzel"'), document.fonts.load('700 200px "Cinzel"')]).catch(() => {});
  const [c, ctx] = canvas(2560, 720);
  const cx = c.width / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const lines = [
    { text: "YOUR ONE-STOP LIBRARY", font: '600 84px "Cinzel", Georgia, serif', spacing: "30px", x: cx + 15, y: 170 },
    { text: "for every Bitcoin book", font: '700 196px "Cinzel", Georgia, serif', spacing: "4px", x: cx, y: 420 },
  ];
  const set = (l: (typeof lines)[number]) => {
    ctx.font = l.font;
    ctx.letterSpacing = l.spacing;
  };
  // A soft dark halo first, so the gold reads even over the glowing rose window behind it.
  ctx.shadowColor = "rgb(8 5 4 / 0.95)";
  ctx.shadowBlur = 70;
  ctx.fillStyle = "rgb(12 8 6 / 0.7)";
  for (const l of lines) {
    set(l);
    ctx.fillText(l.text, l.x, l.y);
    ctx.fillText(l.text, l.x, l.y);
  }
  ctx.shadowColor = "rgb(247 147 26 / 0.5)";
  ctx.shadowBlur = 36;
  set(lines[0]);
  ctx.fillStyle = "rgb(217 164 65 / 0.95)";
  ctx.fillText(lines[0].text, lines[0].x, lines[0].y);
  set(lines[1]);
  const g = ctx.createLinearGradient(0, 230, 0, 440);
  g.addColorStop(0, "#fff4dc");
  g.addColorStop(0.5, "#efd9a8");
  g.addColorStop(1, "#c8913f");
  ctx.fillStyle = g;
  ctx.fillText(lines[1].text, lines[1].x, lines[1].y);

  ctx.shadowBlur = 18;
  ctx.strokeStyle = "rgb(217 164 65 / 0.8)";
  ctx.lineWidth = 3;
  for (const [a, b] of [[cx - 520, cx - 70], [cx + 70, cx + 520]]) {
    ctx.beginPath();
    ctx.moveTo(a, 540);
    ctx.lineTo(b, 540);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(cx, 540);
  ctx.rotate((14 * Math.PI) / 180);
  ctx.scale(2.6, 2.6);
  ctx.translate(-12, -12);
  ctx.fillStyle = "rgb(230 180 80)";
  ctx.fill(bitcoin, "evenodd");
  ctx.restore();
  return c;
}

// ---------- the stacks room ----------

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// A wall of shelves with real covers standing face-out, "THE STACKS" carved above.
async function coverWallCanvas() {
  const s = 1.2;
  const W = COVER_WALL.w;
  const H = COVER_WALL.h;
  const [c, ctx] = canvas(W * s, H * s);
  ctx.scale(s, s);
  // dark wood panelling, lit warm in the middle
  ctx.fillStyle = "#1c120c";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.45, W * 0.6);
  glow.addColorStop(0, "rgb(247 147 26 / 0.22)");
  glow.addColorStop(1, "rgb(247 147 26 / 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgb(0 0 0 / 0.25)";
  for (let x = 0; x < W; x += 160) ctx.fillRect(x, 0, 3, H);

  ctx.textAlign = "center";
  ctx.font = '600 30px "Cinzel", Georgia, serif';
  ctx.letterSpacing = "18px";
  ctx.fillStyle = "rgb(217 164 65 / 0.9)";
  ctx.shadowColor = "rgb(247 147 26 / 0.5)";
  ctx.shadowBlur = 16;
  ctx.fillText("THE STACKS", W / 2 + 9, 96);
  ctx.shadowBlur = 0;

  const withCovers = books.filter((b) => b.cover);
  const cols = 9;
  const rows = 2;
  const bw = 150;
  const bh = 225;
  const gap = 46;
  const rowH = bh + 90;
  const x0 = (W - (cols * bw + (cols - 1) * gap)) / 2;
  const imgs = await Promise.all(withCovers.slice(0, cols * rows).map((b) => loadImage(b.cover!)));
  for (let r = 0; r < rows; r++) {
    const shelfY = 180 + r * rowH + bh;
    for (let i = 0; i < cols; i++) {
      const img = imgs[r * cols + i];
      if (!img) continue;
      const x = x0 + i * (bw + gap);
      ctx.shadowColor = "rgb(0 0 0 / 0.6)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(img, x, shelfY - bh, bw, bh);
    }
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = "#3d2616";
    ctx.fillRect(x0 - 40, shelfY, W - 2 * (x0 - 40), 14);
    ctx.fillStyle = "#6b4520";
    ctx.fillRect(x0 - 40, shelfY, W - 2 * (x0 - 40), 2);
  }
  // fall off into shadow at the edges
  const edge = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.62);
  edge.addColorStop(0, "rgb(11 9 13 / 0)");
  edge.addColorStop(1, "rgb(11 9 13 / 0.9)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, W, H);
  return c;
}

// ---------- all of it ----------

export type HallTextures = Awaited<ReturnType<typeof loadHallTextures>>;

export async function loadHallTextures() {
  const shelves = await Promise.all([11, 22, 33, 44, 55, 66].map(bookcase));
  const [farWallC, farWallCtx] = await svgCanvas(
    farWallSvg(ARCH_W, ARCH_H, DOOR_TOP - ARCH_TOP, -470 - ARCH_TOP, 300, SHELF_H, [bookcaseSvg(77, 480, SHELF_H), bookcaseSvg(88, 480, SHELF_H)]),
    1.5,
  );
  // Open the doorway: cut it out (keeping a little of the frame) so the room behind shows.
  farWallCtx.save();
  farWallCtx.scale(1.5, 1.5);
  farWallCtx.globalCompositeOperation = "destination-out";
  farWallCtx.translate(ARCH_W / 2, ARCH_H);
  farWallCtx.scale(0.97, 0.985);
  farWallCtx.translate(-ARCH_W / 2, -ARCH_H);
  farWallCtx.fill(new Path2D(doorPath(ARCH_W, ARCH_H, DOOR_TOP - ARCH_TOP)));
  farWallCtx.restore();
  const [archC] = await svgCanvas(archSvg(), 1);
  const candleBodies = await Promise.all(
    CANDLE_HEIGHTS.flatMap((h) => [1, 2, 3].map(async (drips) => texture((await svgCanvas(candleBodySvg(h, drips), 3))[0]))),
  );
  const [flameC] = await svgCanvas(flameSvg(), 4);
  return {
    shelves,
    farWall: texture(farWallC),
    arch: texture(archC),
    floor: texture(floorTile(), { repeatY: BAYS.length }),
    shaft: texture(shaftCanvas()),
    pool: texture(radialCanvas(256, [[0, "rgb(247 147 26 / 0.3)"], [0.65, "rgb(247 147 26 / 0)"]])),
    glow: texture(radialCanvas(256, [[0, "rgb(255 196 110 / 0.5)"], [0.22, "rgb(255 160 60 / 0.16)"], [0.45, "rgb(255 140 40 / 0.05)"], [0.68, "rgb(0 0 0 / 0)"]])),
    flame: texture(flameC),
    candleBodies, // index: heightIndex * 3 + (drips - 1)
    covers: BOOK_COVERS.map((col) => texture(coverCanvas(col))),
    pages: texture(pagesCanvas()),
    inscription: texture(await inscriptionCanvas()),
    coverWall: texture(await coverWallCanvas()),
  };
}

export function disposeHallTextures(t: HallTextures) {
  const all = [t.farWall, t.arch, t.floor, t.shaft, t.pool, t.glow, t.flame, t.pages, t.inscription, t.coverWall, ...t.shelves, ...t.candleBodies, ...t.covers];
  all.forEach((x) => x.dispose());
}

