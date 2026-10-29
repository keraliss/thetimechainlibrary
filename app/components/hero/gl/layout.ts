import { mulberry32 } from "~/lib/random";

// The hall's dimensions, in px at a 900px-tall viewport (the camera's field of view is set so
// 900px at distance PERSPECTIVE fills the screen height). Same convention as the page: eye at
// the origin, +y DOWN, +z toward the viewer. HallGL flips y for three.js.

export const PERSPECTIVE = 900;
export const FOV = (2 * Math.atan(450 / PERSPECTIVE) * 180) / Math.PI;
export const HORIZON = 0.45; // where the vanishing point sits, from the top of the screen

export const HW = 720; // half the hall's width: the shelves stand at x = ±HW
export const FLOOR = 430;
export const SHELF_TOP = -230;
export const SPRING = -170; // where the arches start to curve
export const APEX = -820;
export const STEP = 520; // distance between arches
export const FAR = -2600; // the far wall, with the rose window and the doorway
export const ARCHES = [-120, -640, -1160, -1680, -2200];
const EDGES = [520, ...ARCHES, FAR]; // shelves and floor run in bays between these depths
export const BAYS = EDGES.slice(0, -1).map((zNear, i) => ({ zNear, zFar: EDGES[i + 1] }));
export const HALL_NEAR = EDGES[0];

export const SHELF_H = FLOOR - SHELF_TOP;
export const ARCH_W = HW * 2 + 200;
export const ARCH_TOP = APEX - 80;
export const ARCH_H = FLOOR - ARCH_TOP;

// How far the camera walks: to the doorway, looking at the wall of covers in the room behind.
export const WALK_DISTANCE = -FAR + 20;

// Fog: the far end of the hall sinks into the gloom.
export const FOG_NEAR = 450;
export const FOG_FAR = 3300;

// ---------- the stacks room, behind the doorway ----------

// A wall of real covers on shelves, seen through the doorway and reached at the end of the
// walk. The library page then fades in over it.
export const DOOR_TOP = -130;
// Sized so that from the doorway (where the walk ends, 860 away) it exactly fills the view.
export const COVER_WALL = { z: -3480, w: 2000, h: 860, y: 40 } as const;

// ---------- the inscription ----------

// A gold inscription floating just past the last arch, at eye level. Seen from
// the entrance it's tiny; it grows straight toward you as you walk and is left behind just
// before the doorway. Fades in by distance (fadeIn, far → near) once the title has gone, and
// out (fadeOut) before it's close enough to blur.
export const INSCRIPTION = { z: -2300, y: -10, width: 1000, widthSmall: 430, fadeIn: [1900, 1450], fadeOut: [420, 200] } as const;

// ---------- candles ----------

export const CANDLE_SCALE = 1.7;
export const CANDLE_W = 28;
export const CANDLE_TOP = 30; // within a candle's box: flame above, wax below
export const CANDLE_HEIGHTS = [0.7, 0.85, 1, 1.15];
export const candleBoxH = (height: number) => CANDLE_TOP + Math.round(70 * height);

export type CandleSpot = {
  x: number;
  y: number; // top of the candle's box
  z: number;
  heightIndex: number;
  drips: number;
  phase: number;
  bob: number;
};

// Candles hang inside the arches' profile, spread all the way down the hall, either side of
// the aisle: hung over the middle they'd stack up in front of the rose window and the title.
const AISLE = 240;
export const CANDLES: CandleSpot[] = (() => {
  const rand = mulberry32(21);
  return Array.from({ length: 44 }, () => {
    const x = (rand() < 0.5 ? -1 : 1) * (AISLE + rand() * (HW - 170 - AISLE));
    const ceiling = SPRING - (SPRING - APEX) * 0.75 * (1 - (x / HW) ** 2);
    return {
      x,
      y: ceiling + 90 + rand() * (SPRING + 40 - ceiling - 90),
      z: 380 - rand() * 2800,
      heightIndex: Math.floor(rand() * CANDLE_HEIGHTS.length),
      drips: Math.floor(rand() * 3) + 1,
      phase: rand() * 10,
      bob: 5 + rand() * 4,
    };
  });
})();

// ---------- flying books ----------

export const BOOK_COVERS = ["#6b1f1f", "#1f3b2d", "#24305a", "#6a4414", "#43205a", "#7a2c14"];
export const BOOK_W = 124; // open spread
export const BOOK_H = 86;
export const BOOK_SCALE = 1.5;

export type BookFlight = { y: number; z: number; cover: number; flap: number; bob: number; dir: 1 | -1; duration: number; offset: number };

export const BOOKS: BookFlight[] = (() => {
  const rand = mulberry32(2009);
  return Array.from({ length: 8 }, (_, i) => ({
    y: -520 + rand() * 360,
    z: -160 - rand() * 2300,
    cover: i % BOOK_COVERS.length,
    flap: 1.1 + rand() * 0.5,
    bob: 3 + rand() * 2.5,
    dir: i % 2 === 0 ? 1 : -1,
    duration: 26 + rand() * 18,
    offset: rand(),
  }));
})();
export const BOOK_SPAN = HW + 260; // books fly from wall to wall, starting just out of sight
