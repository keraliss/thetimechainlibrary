import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { INSCRIPTION_ASPECT, disposeHallTextures, loadHallTextures, type HallTextures } from "./glTextures";
import {
  ARCHES,
  ARCH_H,
  ARCH_TOP,
  ARCH_W,
  BAYS,
  BOOKS,
  BOOK_H,
  BOOK_SCALE,
  BOOK_SPAN,
  BOOK_W,
  CANDLES,
  CANDLE_HEIGHTS,
  CANDLE_SCALE,
  CANDLE_TOP,
  CANDLE_W,
  COVER_WALL,
  FAR,
  FLOOR,
  FOG_FAR,
  FOG_NEAR,
  FOV,
  HALL_NEAR,
  HORIZON,
  HW,
  INSCRIPTION,
  SHELF_H,
  SHELF_TOP,
  candleBoxH,
  type BookFlight,
} from "./layout";

// The hall, drawn with WebGL in a single canvas. (It used to be CSS 3D: with ~120 panels,
// Chrome's compositor kept re-splitting and re-rasterizing layers and showed black boxes and
// stutter while scrolling. One canvas has no layers to get wrong.)
// Layout is in page px with +y down; three.js has +y up, hence the minus signs on y.

type Props = {
  cam: MotionValue<number>;
  small: boolean;
  lookX: MotionValue<number>;
  lookY: MotionValue<number>;
  candleCount: number;
  bookCount: number;
  reduced: boolean;
};

const BG = "#0b090d";
const deg = Math.PI / 180;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function CameraRig({ cam, lookX, lookY }: Pick<Props, "cam" | "lookX" | "lookY">) {
  const { camera, size } = useThree();
  useEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    // Put the vanishing point at HORIZON instead of the middle of the screen.
    c.setViewOffset(size.width, size.height, 0, (0.5 - HORIZON) * size.height, size.width, size.height);
    c.rotation.order = "YXZ";
    c.updateProjectionMatrix();
  }, [camera, size]);
  useFrame(() => {
    camera.position.set(0, 0, -cam.get());
    camera.rotation.y = lookX.get() * -5 * deg;
    camera.rotation.x = lookY.get() * -3 * deg;
  });
  return null;
}

function Hall({ tex }: { tex: HallTextures }) {
  return (
    <>
      <mesh position={[0, -(ARCH_TOP + ARCH_H / 2), FAR]}>
        <planeGeometry args={[ARCH_W, ARCH_H]} />
        {/* no fog: the rose window should glow down the length of the hall. The doorway is cut out. */}
        <meshBasicMaterial map={tex.farWall} fog={false} alphaTest={0.5} />
      </mesh>
      {/* the room behind the doorway: a wall of real covers */}
      <mesh position={[0, -COVER_WALL.y, COVER_WALL.z]}>
        <planeGeometry args={[COVER_WALL.w, COVER_WALL.h]} />
        <meshBasicMaterial map={tex.coverWall} fog={false} />
      </mesh>
      <mesh position={[0, -FLOOR, (FAR + COVER_WALL.z) / 2]} rotation-x={-90 * deg}>
        <planeGeometry args={[COVER_WALL.w, FAR - COVER_WALL.z]} />
        <meshBasicMaterial map={tex.floor} fog={false} color="#8a7a70" />
      </mesh>
      {/* light from the rose window, and the pool it leaves on the runner */}
      <mesh position={[0, -(-200 + FLOOR) / 2, FAR + 40]}>
        <planeGeometry args={[1000, FLOOR + 200]} />
        <meshBasicMaterial map={tex.shaft} transparent blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      <mesh position={[0, -FLOOR + 1, FAR + 420]} rotation-x={-90 * deg}>
        <planeGeometry args={[1100, 820]} />
        <meshBasicMaterial map={tex.pool} transparent blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      <mesh position={[0, -FLOOR, (HALL_NEAR + FAR) / 2]} rotation-x={-90 * deg}>
        <planeGeometry args={[HW * 2, HALL_NEAR - FAR]} />
        <meshBasicMaterial map={tex.floor} />
      </mesh>
      {BAYS.map((b, i) =>
        ([-1, 1] as const).map((side) => (
          <mesh
            key={`${b.zNear}${side}`}
            position={[side * HW, -(SHELF_TOP + FLOOR) / 2, (b.zNear + b.zFar) / 2]}
            rotation-y={side === -1 ? 90 * deg : -90 * deg}
          >
            <planeGeometry args={[b.zNear - b.zFar, SHELF_H]} />
            <meshBasicMaterial map={tex.shelves[(i * 2 + (side === 1 ? 1 : 0)) % tex.shelves.length]} />
          </mesh>
        )),
      )}
      {ARCHES.map((z) => (
        <mesh key={z} position={[0, -(ARCH_TOP + ARCH_H / 2), z]}>
          <planeGeometry args={[ARCH_W, ARCH_H]} />
          <meshBasicMaterial map={tex.arch} alphaTest={0.5} />
        </mesh>
      ))}
    </>
  );
}

// Candles: wax body, a flame that flickers on its own, and an additive glow around it.
function Candles({ tex, count, cam, reduced }: { tex: HallTextures; count: number; cam: MotionValue<number>; reduced: boolean }) {
  const items = CANDLES.slice(0, count);
  const refs = useRef<{ body: THREE.Sprite | null; flame: THREE.Sprite | null; glow: THREE.Sprite | null }[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const c = cam.get();
    items.forEach((k, i) => {
      const r = refs.current[i];
      if (!r?.body || !r.flame || !r.glow) return;
      // Fade out as you walk under it (it's sliding off the top of the screen anyway).
      const shown = 1 - clamp01((k.z + c - 160) / 200);
      const visible = shown > 0;
      r.body.visible = r.flame.visible = r.glow.visible = visible;
      if (!visible) return;
      const bob = reduced ? 0 : Math.sin((t / k.bob) * Math.PI * 2 + k.phase) * 6;
      const flick = reduced ? 1 : 0.88 + 0.12 * Math.sin(t * 9.1 + k.phase * 3) * Math.sin(t * 3.7 + k.phase);
      const h = candleBoxH(CANDLE_HEIGHTS[k.heightIndex]) * CANDLE_SCALE;
      r.body.position.y = -(k.y + h / 2) + bob;
      r.flame.position.y = -(k.y + (CANDLE_TOP - 2) * CANDLE_SCALE) + bob;
      r.flame.scale.set(CANDLE_W * CANDLE_SCALE * (2 - flick), CANDLE_TOP * CANDLE_SCALE * flick * 1.05, 1);
      r.glow.position.y = -(k.y + 14 * CANDLE_SCALE) + bob;
      r.glow.scale.setScalar(220 * CANDLE_SCALE * (0.96 + 0.06 * flick));
      (r.body.material as THREE.SpriteMaterial).opacity = shown;
      (r.flame.material as THREE.SpriteMaterial).opacity = shown;
      (r.glow.material as THREE.SpriteMaterial).opacity = shown * flick;
    });
  });
  return (
    <>
      {items.map((k, i) => {
        const h = candleBoxH(CANDLE_HEIGHTS[k.heightIndex]) * CANDLE_SCALE;
        const set = (part: "body" | "flame" | "glow") => (el: THREE.Sprite | null) => {
          refs.current[i] = { ...(refs.current[i] ?? { body: null, flame: null, glow: null }), [part]: el };
        };
        return (
          <group key={i}>
            <sprite ref={set("glow")} position={[k.x, -(k.y + 14 * CANDLE_SCALE), k.z - 1]} scale={220 * CANDLE_SCALE}>
              <spriteMaterial map={tex.glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
            </sprite>
            <sprite ref={set("body")} position={[k.x, -(k.y + h / 2), k.z]} scale={[CANDLE_W * CANDLE_SCALE, h, 1]}>
              <spriteMaterial map={tex.candleBodies[k.heightIndex * 3 + (k.drips - 1)]} transparent depthWrite={false} />
            </sprite>
            <sprite
              ref={set("flame")}
              position={[k.x, -(k.y + (CANDLE_TOP - 2) * CANDLE_SCALE), k.z + 0.5]}
              scale={[CANDLE_W * CANDLE_SCALE, CANDLE_TOP * CANDLE_SCALE, 1]}
              center={[0.5, 0]}
            >
              <spriteMaterial map={tex.flame} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
            </sprite>
          </group>
        );
      })}
    </>
  );
}

// The floating inscription. Perspective does the "small, then big, then behind you"; this only
// fades it by distance and lets it drift a little.
function Inscription({ tex, cam, small }: { tex: HallTextures; cam: MotionValue<number>; small: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex.inscription, transparent: true, depthWrite: false, fog: false }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const d = -(INSCRIPTION.z + cam.get()); // distance in front of the camera
    const [inFar, inNear] = INSCRIPTION.fadeIn;
    const [outFar, outNear] = INSCRIPTION.fadeOut;
    mat.opacity = clamp01((inFar - d) / (inFar - inNear)) * clamp01((d - outNear) / (outFar - outNear));
    m.visible = mat.opacity > 0;
    m.position.y = -INSCRIPTION.y + Math.sin(clock.elapsedTime * 0.7) * 8;
  });
  const w = small ? INSCRIPTION.widthSmall : INSCRIPTION.width;
  return (
    <mesh ref={mesh} position={[0, -INSCRIPTION.y, INSCRIPTION.z]} material={mat} renderOrder={10}>
      <planeGeometry args={[w, w / INSCRIPTION_ASPECT]} />
    </mesh>
  );
}

// A hardcover flying across the hall, beating its covers like wings, seen from below.
function Book({ b, tex, cam }: { b: BookFlight; tex: HallTextures; cam: MotionValue<number> }) {
  const root = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const mats = useMemo(
    () => ({
      cover: new THREE.MeshBasicMaterial({ map: tex.covers[b.cover], side: THREE.DoubleSide, transparent: true }),
      pages: new THREE.MeshBasicMaterial({ map: tex.pages, side: THREE.DoubleSide, transparent: true }),
      spine: new THREE.MeshBasicMaterial({ color: "#2a1a12", transparent: true }),
    }),
    [b.cover, tex],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  useFrame(({ clock }) => {
    const g = root.current;
    if (!g || !left.current || !right.current) return;
    const t = clock.elapsedTime;
    const shown = 1 - clamp01((b.z + cam.get() - 300) / 220);
    g.visible = shown > 0;
    if (!g.visible) return;
    const frac = (t / b.duration + b.offset) % 1;
    g.position.x = -b.dir * BOOK_SPAN + 2 * b.dir * BOOK_SPAN * frac;
    g.position.y = -b.y + Math.sin((t / b.bob) * Math.PI) * 16;
    g.rotation.z = Math.sin((t / b.bob) * Math.PI) * 0.06;
    const flap = (12 + 52 * (0.5 - 0.5 * Math.cos((t / b.flap) * Math.PI))) * deg;
    left.current.rotation.y = -flap;
    right.current.rotation.y = flap;
    mats.cover.opacity = mats.pages.opacity = mats.spine.opacity = shown;
  });
  const half = BOOK_W / 2;
  return (
    <group ref={root} position={[0, -b.y, b.z]}>
      <group rotation-x={-34 * deg} scale={BOOK_SCALE}>
        {([
          [left, -1],
          [right, 1],
        ] as const).map(([ref, s]) => (
          <group key={s} ref={ref}>
            <mesh position={[(s * half) / 2, 0, -4]} material={mats.pages}>
              <planeGeometry args={[half - 2, BOOK_H - 6]} />
            </mesh>
            <mesh position={[(s * half) / 2, 0, 0]} material={mats.cover}>
              <planeGeometry args={[half, BOOK_H]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0, 0.5]} material={mats.spine}>
          <planeGeometry args={[8, BOOK_H + 2]} />
        </mesh>
      </group>
    </group>
  );
}

export default function HallGL({ cam, small, lookX, lookY, candleCount, bookCount, reduced }: Props) {
  const [tex, setTex] = useState<HallTextures | null>(null);
  const [onScreen, setOnScreen] = useState(true);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    let loaded: HallTextures | null = null;
    loadHallTextures().then((t) => {
      loaded = t;
      if (alive) setTex(t);
      else disposeHallTextures(t);
    });
    return () => {
      alive = false;
      if (loaded) disposeHallTextures(loaded);
    };
  }, []);

  // Stop drawing once the hall has scrolled away.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className="absolute inset-0" style={{ background: BG }}>
      {tex && (
        <Canvas
          flat
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          camera={{ fov: FOV, near: 1, far: 6000, position: [0, 0, 0] }}
          frameloop={onScreen ? "always" : "never"}
        >
          <color attach="background" args={[BG]} />
          <fog attach="fog" args={[BG, FOG_NEAR, FOG_FAR]} />
          <CameraRig cam={cam} lookX={lookX} lookY={lookY} />
          <Hall tex={tex} />
          <Candles tex={tex} count={candleCount} cam={cam} reduced={reduced} />
          <Inscription tex={tex} cam={cam} small={small} />
          {!reduced && BOOKS.slice(0, bookCount).map((b, i) => <Book key={i} b={b} tex={tex} cam={cam} />)}
        </Canvas>
      )}
    </div>
  );
}
