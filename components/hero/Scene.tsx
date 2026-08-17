"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import Grain from "./Grain";
import Nebula from "./Nebula";

/* ---- tuning constants ---------------------------------------------------- */
const STAR_COUNT = 480;
const EMBER_RATIO = 0.12;
const MOON_RADIUS = 1.15;
const MOON_SPIN = 0.028; // rad/s — gentle idle auto-spin
const GLOW_PERIOD = 12; // s — sun-glow pulse

/* ---- eclipse glow tuning ------------------------------------------------- */
// The moon's silhouette maps to fraction F_EDGE (~0.9) of the tight rim/chromosphere
// sprites; the streamer corona is a SEPARATE, larger plane so its filaments reach out
// past the disc like a real corona. All textures are baked ONCE at mount (no runtime
// cost); a single `phase` (the GLOW_PERIOD pulse) gently animates opacities.
const F_EDGE = 0.9; // sprite fraction the moon's silhouette maps to on the tight planes
const CORONA_REACH = 1.55; // streamer-corona plane size vs the tight glow (bigger ⇒ longer streamers)
const STREAMER_COUNT = 220; // radial filaments baked into the corona
const STREAMER_CONTRAST = 0.95; // 0..1 — how much streamers vary vs a smooth ring
const DIAMOND_ANGLE = Math.PI * 0.28; // rim angle of the diamond bead (0 = +x/right, CCW); upper-right = sun side
const DIAMOND_SIZE = 0.4; // bead sprite size as a fraction of the moon's silhouette radius
const PROMINENCE_COUNT = 3; // small chromosphere flares poking past the limb

/* drag-to-spin (globe): grabbing the moon adds a fling on top of the idle spin;
   the fling's angular velocity decays back to the idle spin with this friction (1/s). */
const SPIN_FRICTION = 5;

/* the moon travels to these positions/scales as scroll progresses (0..1). */
// The moon PINS at two spots and, from that moment, moves EXACTLY like a static
// element in the page — locked 1:1 to scroll (no damping → no bounce):
//   • Manifesto dock (RIGHT, p0.1026): pinned to the page, it scrolls straight UP
//     off the top with the content; hidden once past HIDE_START.
//   • How-to-buy (LEFT, p0.8817): pinned to the page, it rises up from below into
//     its resting spot as the section scrolls in (from HIDE_END), then hands off
//     to the cinematic footer-return.
// The dock progress is each section's CENTRED-in-viewport point = section-mid −
// ½ viewport (NOT the raw mid, which is where the mid hits the viewport TOP —
// that anchored the moon at the section's bottom/top). So the moon's fixed
// document anchor lands at the section's vertical CENTRE.
// The pin sets position from the LIVE window.scrollY × the true world-per-pixel
// (from camera fov/z ÷ viewport height) — the same value Lenis drives the content
// with, so the moon and the page move as one. sampleMoon (smoothstep + damping) is
// used ONLY for the two cinematic spans — hero→manifesto [0,0.1026] and
// how-to-buy→footer [0.8817,1] — plus the invisible snap while hidden.
// Measured (post Ticker-section removal) section mid-progress: manifesto 0.1418,
// how-to-buy 0.9209; half a viewport ≈ 0.0392 progress → dock (centred) =
// 0.1026 / 0.8817 (re-measure if layout changes).
// Desktop-measured defaults; on the home page these are replaced each frame by
// live-measured fractions (docksRef) so the docks track the real section positions
// on any viewport (landscape phone/tablet reflow the doc height). They also stay the
// SSR/first-frame fallback and reproduce the desktop values, so desktop is unchanged.
const P_DOCK_MAN = 0.1026; // manifesto CENTRED in viewport — pin takes over here
const HIDE_START = 0.21; // manifesto pin has scrolled off the top → hide
const HIDE_END = 0.8; // about to rise into how-to-buy → pin resumes
const P_DOCK_BUY = 0.8817; // how-to-buy CENTRED in viewport — pin hands off to the footer travel
// The hide window as progress OFFSETS from each dock — preserved from the desktop
// tuning (man→hideStart, hideEnd→buy) so it reproduces exactly on desktop and stays
// a sensible pin distance when the docks are re-measured on other viewports.
const HIDE_PAD_START = HIDE_START - P_DOCK_MAN; // 0.1074
const HIDE_PAD_END = P_DOCK_BUY - HIDE_END; // 0.0817
const PIN_X_MAN = 1.9;
const PIN_Y_MAN = 0.2;
const PIN_X_BUY = -1.9;
const PIN_Y_BUY = -0.15;
const PIN_S = 0.5; // moon scale while pinned
// how-to-buy → footer return: a single continuous ARC (quadratic Bézier) instead of
// a hold-then-dart. P0 = the how-to-buy rest (= pin handoff), P2 = footer centre,
// and BUY_CTRL is the control point: its x well right of the straight-line midpoint
// pulls the horizontal motion toward centre EARLY (fast approach, soft landing); its
// y above both endpoints gives the gentle upward bow. Tunable: raise y for a taller
// arc, move x toward 0 for an even quicker approach.
const FOOTER_Y = 0.05;
const FOOTER_S = 0.95;
const BUY_CTRL = { x: -0.4, y: 0.2 };
// hero → manifesto: the same log-sweep arc character as BUY_CTRL. `xFrac` is the
// control point as a fraction of the (aspect-clamped) dock X so it scales with the
// clamp; `y` sits above both endpoints for the gentle upward bow.
const MAN_CTRL = { xFrac: 0.79, y: 0.55 };

/** Docking-mode moon target for scroll-progress `p`. Dock fractions (`man`,`buy`)
 *  and dock X offsets (`xMan`,`xBuy`) are passed in so they can be live-measured and
 *  aspect-clamped; the keyframes are hero(0)→manifesto→how-to-buy, then the arc. */
function sampleMoon(
  p: number,
  man: number,
  buy: number,
  xMan: number,
  xBuy: number,
) {
  if (p >= buy) {
    // how-to-buy → footer: one smooth arc so the moon sweeps toward centre from the
    // start (fast → soft landing, slight upward bow) instead of sinking then darting.
    const u = Math.min(1, (p - buy) / (1 - buy));
    const iu = 1 - u;
    return {
      x: iu * iu * xBuy + 2 * iu * u * BUY_CTRL.x + u * u * 0,
      y: iu * iu * PIN_Y_BUY + 2 * iu * u * BUY_CTRL.y + u * u * FOOTER_Y,
      s: PIN_S + (FOOTER_S - PIN_S) * (u * u * (3 - 2 * u)), // smoothstep scale
    };
  }
  if (p < man) {
    // hero → manifesto: one smooth arc (fast toward the dock, soft arrival, slight
    // upward bow) instead of a straight diagonal — mirrors the footer return.
    const u = man > 0 ? p / man : 1;
    const iu = 1 - u;
    const cx = MAN_CTRL.xFrac * xMan; // P0=(0,0) → ctrl=(cx,MAN_CTRL.y) → P2=(xMan,PIN_Y_MAN)
    return {
      x: 2 * iu * u * cx + u * u * xMan,
      y: 2 * iu * u * MAN_CTRL.y + u * u * PIN_Y_MAN,
      s: 1.0 + (PIN_S - 1.0) * (u * u * (3 - 2 * u)), // smoothstep 1.0 → 0.5
    };
  }
  // manifesto → how-to-buy (only the invisible hidden-snap span): straight interp
  const t = buy > man ? (p - man) / (buy - man) : 0;
  const e = t * t * (3 - 2 * t); // smoothstep
  return {
    x: xMan + (xBuy - xMan) * e,
    y: PIN_Y_MAN + (PIN_Y_BUY - PIN_Y_MAN) * e,
    s: PIN_S,
  };
}

/** Portrait (centered) mode scale curve over scroll-progress `p`: large in the hero,
 *  recedes through the middle, grows back toward the footer (multiplied by a
 *  fit-to-width factor by the caller so the disc never overflows a narrow frame). */
function centeredScale(p: number) {
  const smooth = (u: number) => u * u * (3 - 2 * u);
  if (p < 0.5) return 1.0 + (0.6 - 1.0) * smooth(p / 0.5); // 1.0 → 0.6
  return 0.6 + (0.9 - 0.6) * smooth((p - 0.5) / 0.5); // 0.6 → 0.9
}

// reused each frame (no per-frame allocation) for the glow-billboard math
const _P = new THREE.Vector3();
const _C = new THREE.Vector3();
const _CP = new THREE.Vector3();
// world axes for the drag-spin (screen horizontal / vertical) + a scratch vector
// for projecting the moon's silhouette to screen pixels
const WORLD_X = new THREE.Vector3(1, 0, 0);
const WORLD_Y = new THREE.Vector3(0, 1, 0);
const _EDGE = new THREE.Vector3();

/** Build a soft radial-gradient sprite texture from color stops. */
function makeGlow(stops: [number, string][]) {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Baked STREAMER corona: the moon's silhouette sits at fraction `edge` of the sprite;
 *  from there outward we draw many thin radial wisps whose length + brightness vary with
 *  angle (fine sinusoidal filaments + two broad opposing equatorial streamers + softer
 *  polar plumes), coloured white-hot at the limb → warm corona → ember tail. Additive
 *  over near-black ⇒ a luminous, structured corona instead of a smooth ring. */
function makeCorona(edge: number) {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const cx = s / 2;
  const cy = s / 2;
  const rEdge = (s / 2) * edge; // silhouette radius in px
  const rMax = s / 2;
  // random but stable per-angle filament amplitudes
  const seed = (i: number) => {
    const x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  ctx.globalCompositeOperation = "lighter"; // additive: overlapping wisps build up
  const eqPhase = Math.PI * 0.5; // equatorial streamer axis (vertical here → reads as side lobes when billboarded)
  for (let i = 0; i < STREAMER_COUNT; i++) {
    const a = (i / STREAMER_COUNT) * Math.PI * 2;
    // angular brightness: fine filaments + broad equatorial lobes (cos 2θ) + faint plumes
    const fine =
      0.5 +
      0.5 *
        Math.sin(a * 9 + seed(i) * 6.28) *
        Math.sin(a * 23 + seed(i + 7) * 6.28);
    const equator = 0.5 + 0.5 * Math.cos(2 * (a - eqPhase)); // two opposing broad streamers
    const amp =
      1 -
      STREAMER_CONTRAST +
      STREAMER_CONTRAST * (0.35 * fine + 0.65 * equator);
    const len = rEdge + (rMax - rEdge) * (0.45 + 0.55 * amp); // streamer reach
    const grad = ctx.createLinearGradient(
      cx + Math.cos(a) * rEdge,
      cy + Math.sin(a) * rEdge,
      cx + Math.cos(a) * len,
      cy + Math.sin(a) * len,
    );
    const b = amp; // brightness of this wisp
    grad.addColorStop(0.0, `rgba(255,250,240,${0.11 * b})`); // white-hot at the limb
    grad.addColorStop(0.18, `rgba(248,196,128,${0.09 * b})`); // warm corona
    grad.addColorStop(0.55, `rgba(200,119,64,${0.05 * b})`); // ember tail
    grad.addColorStop(1.0, "rgba(200,119,64,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth =
      ((Math.PI * 2 * rEdge) / STREAMER_COUNT) * (0.8 + 1.6 * seed(i + 3));
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * rEdge, cy + Math.sin(a) * rEdge);
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Baked CHROMOSPHERE: a thin red-orange ring right at the limb (fraction `edge`) with a
 *  few small prominence arcs poking just past it — the "ring of fire" + solar flares. Kept
 *  thin/low so it's a hairline, not a red halo (ember stays surgical). */
function makeChromosphere(edge: number) {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const cx = s / 2;
  const cy = s / 2;
  const rEdge = (s / 2) * edge;
  // thin bright ring just outside the silhouette
  const ring = ctx.createRadialGradient(
    cx,
    cy,
    rEdge * 0.985,
    cx,
    cy,
    rEdge * 1.06,
  );
  ring.addColorStop(0.0, "rgba(255,120,70,0)");
  ring.addColorStop(0.45, "rgba(255,96,60,0.5)"); // chromosphere red-orange
  ring.addColorStop(0.7, "rgba(255,150,90,0.32)");
  ring.addColorStop(1.0, "rgba(255,120,70,0)");
  ctx.fillStyle = ring;
  ctx.fillRect(0, 0, s, s);
  // a few small prominence flares just past the limb
  ctx.globalCompositeOperation = "lighter";
  const seed = (i: number) => {
    const x = Math.sin(i * 78.233) * 12345.678;
    return x - Math.floor(x);
  };
  for (let i = 0; i < PROMINENCE_COUNT; i++) {
    const a = seed(i) * Math.PI * 2;
    const pr = rEdge * (1.02 + 0.05 * seed(i + 1)); // sits just past the limb
    const px = cx + Math.cos(a) * pr;
    const py = cy + Math.sin(a) * pr;
    const size = rEdge * (0.05 + 0.05 * seed(i + 2));
    const fl = ctx.createRadialGradient(px, py, 0, px, py, size);
    fl.addColorStop(0.0, "rgba(255,110,70,0.55)");
    fl.addColorStop(0.5, "rgba(255,80,50,0.28)");
    fl.addColorStop(1.0, "rgba(255,80,50,0)");
    ctx.fillStyle = fl;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function Scene({
  reduce,
  hideMoon = false,
  progressRef,
  scrollMaxRef,
  pointerRef,
  spinRef,
  moonScreenRef,
  docksRef,
}: {
  reduce: boolean;
  hideMoon?: boolean;
  progressRef?: { current: number };
  scrollMaxRef?: { current: number };
  docksRef?: { current: { man: number; buy: number } };
  pointerRef?: { current: { x: number; y: number } };
  spinRef?: {
    current: {
      dragging: boolean;
      pendingX: number;
      pendingY: number;
      velX: number;
      velY: number;
    };
  };
  moonScreenRef?: {
    current: { x: number; y: number; r: number; visible: boolean };
  };
}) {
  const [colorMap, bumpMap] = useTexture(["/moon-color.jpg", "/moon-bump.jpg"]);

  useLayoutEffect(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    bumpMap.colorSpace = THREE.NoColorSpace;
  }, [colorMap, bumpMap]);

  // STREAMER corona — wispy radial filaments + broad equatorial streamers on its own
  // LARGER plane (CORONA_REACH) so they reach out past the disc like a real corona. The
  // moon silhouette maps to fraction F_EDGE/CORONA_REACH of this bigger sprite.
  const coronaTex = useMemo(() => makeCorona(F_EDGE / CORONA_REACH), []);

  // WHITE-HOT limb — a tight near-white ring right at the silhouette (fraction ~F_EDGE)
  // blooming to warm within a hair: the hot inner edge of the corona blend. Additive.
  const rimTex = useMemo(
    () =>
      makeGlow([
        [0.0, "rgba(255,250,244,0)"],
        [0.885, "rgba(255,252,246,0)"], // moon occludes up to ~F_EDGE
        [0.905, "rgba(255,253,250,0.5)"], // ring clears the silhouette — white-hot core
        [0.93, "rgba(255,248,236,0.6)"], // brightest, tight white limb
        [0.955, "rgba(255,214,158,0.26)"], // falls to warm corona within a hair
        [0.99, "rgba(244,174,106,0.05)"],
        [1, "rgba(244,174,106,0)"],
      ]),
    [],
  );

  // CHROMOSPHERE — thin red-orange "ring of fire" at the limb + a few prominence flares.
  const chromoTex = useMemo(() => makeChromosphere(F_EDGE), []);

  // DIAMOND ring / Baily's bead — a small brilliant near-white point that sits on the
  // sun-facing rim (see DIAMOND_ANGLE); the single most recognizable eclipse tell.
  const beadTex = useMemo(
    () =>
      makeGlow([
        [0.0, "rgba(255,255,255,0.95)"],
        [0.22, "rgba(255,252,246,0.7)"],
        [0.5, "rgba(255,236,206,0.28)"],
        [0.8, "rgba(255,214,158,0.08)"],
        [1, "rgba(255,214,158,0)"],
      ]),
    [],
  );

  const starsRef = useRef<THREE.Points>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const travelRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Group>(null);
  const coronaMeshRef = useRef<THREE.Mesh>(null);
  const coronaMat = useRef<THREE.MeshBasicMaterial>(null);
  const rimMat = useRef<THREE.MeshBasicMaterial>(null);
  const chromoMat = useRef<THREE.MeshBasicMaterial>(null);
  const beadMat = useRef<THREE.MeshBasicMaterial>(null);
  const px = useRef(0);
  const py = useRef(0);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const col = new Float32Array(STAR_COUNT * 3);
    const warm = new THREE.Color("#eee9e1");
    const ember = new THREE.Color("#c8773f");
    for (let i = 0; i < STAR_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 11;
      pos[i * 3 + 2] = -Math.random() * 7 - 0.5;
      const c = Math.random() < EMBER_RATIO ? ember : warm;
      const b = 0.35 + Math.random() * 0.65;
      col[i * 3] = c.r * b;
      col[i * 3 + 1] = c.g * b;
      col[i * 3 + 2] = c.b * b;
    }
    return [pos, col];
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const pointer = pointerRef ? pointerRef.current : state.pointer;
    // Frame-rate-independent damping: k = 1 − e^(−rate·dt). Rates are tuned so k
    // matches the previous per-frame factors at 60fps (0.04→2.45, 0.06→3.71,
    // 0.08→5.0), so the feel is identical at 60Hz but no longer runs ~2.4× fast
    // at 144Hz. Naturally clamps to ≤1 on a big dt (tab refocus) — no overshoot.
    const kPtr = 1 - Math.exp(-2.45 * delta);
    px.current += (pointer.x - px.current) * kPtr;
    py.current += (pointer.y - py.current) * kPtr;

    if (starsRef.current) {
      // much gentler cursor parallax (inherits px/py smoothing above)
      starsRef.current.position.x = px.current * 0.07;
      starsRef.current.position.y = py.current * 0.05;
      if (!reduce) starsRef.current.rotation.z = t * 0.004;
    }
    // gentle idle auto-spin + drag-to-spin (globe): grabbing the moon adds a fling
    // on top of the idle rotation. Rotations are applied on WORLD axes (screen
    // horizontal/vertical) so the spin stays intuitive regardless of accumulated
    // orientation. On release, the fling decays back to the idle spin (or, under
    // reduced motion, is zeroed by the pointer-up handler so there's no fling).
    if (moonRef.current) {
      if (!reduce)
        moonRef.current.rotateOnWorldAxis(WORLD_Y, MOON_SPIN * delta);
      const s = spinRef?.current;
      if (s) {
        // consume the drag rotation accumulated by the window listeners
        moonRef.current.rotateOnWorldAxis(WORLD_Y, s.pendingY);
        moonRef.current.rotateOnWorldAxis(WORLD_X, s.pendingX);
        s.pendingX = 0;
        s.pendingY = 0;
        if (!s.dragging) {
          moonRef.current.rotateOnWorldAxis(WORLD_Y, s.velY * delta);
          moonRef.current.rotateOnWorldAxis(WORLD_X, s.velX * delta);
          const decay = Math.exp(-SPIN_FRICTION * delta);
          s.velX *= decay;
          s.velY *= decay;
          if (Math.abs(s.velX) < 1e-4) s.velX = 0;
          if (Math.abs(s.velY) < 1e-4) s.velY = 0;
        }
      }
    }
    if (travelRef.current) {
      const g = travelRef.current;
      if (hideMoon) {
        // Off the home page: the MOON_KF journey is tuned to the home page's
        // scroll height, so it's forced hidden every frame here (not just
        // "skipped") — travelRef/glowRef persist across client-side nav within
        // the shared root layout, so a stale visible=true from the homepage
        // must not leak through on a route transition.
        g.visible = false;
        if (glowRef.current) glowRef.current.visible = false;
      } else {
        const p = progressRef ? progressRef.current : 0;
        const cam = state.camera as THREE.PerspectiveCamera;
        const vFOV = (cam.fov * Math.PI) / 180;
        // world units per CSS pixel on the moon's z≈0 plane
        const wpp =
          (2 * Math.tan(vFOV / 2) * cam.position.z) / state.size.height;
        // world half-extents of the frame at the moon plane (fov is vertical, so the
        // half-width scales with aspect — narrow frames have a small half-width)
        const halfH = Math.tan(vFOV / 2) * cam.position.z;
        const halfW = halfH * (state.size.width / state.size.height);
        const portrait = state.size.width < state.size.height;

        if (portrait) {
          // CENTERED mode (portrait): no left/right dock — mobile content is full
          // width, so there's no empty half to sit in. The moon stays horizontally
          // centred behind the content; only its scale (recede through the middle,
          // grow back toward the footer) and a gentle vertical drift change with
          // scroll, multiplied by a fit-to-width factor so the disc never clips.
          const fit = Math.min(1, (halfW * 0.82) / MOON_RADIUS);
          g.position.set(0, 0.1 * Math.sin(p * Math.PI), 0);
          g.scale.setScalar(fit * centeredScale(p));
          g.visible = true;
        } else {
          // DOCKING mode (landscape / desktop): the moon PINS at the manifesto /
          // how-to-buy spots (locked 1:1 to scroll, no damping), hides between, and
          // does the cinematic smoothstep travel elsewhere. Dock fractions are
          // live-measured (docksRef) and the dock X is aspect-clamped so the disc
          // stays on-frame on narrower landscapes (e.g. 4:3 tablet).
          const max = scrollMaxRef ? scrollMaxRef.current : 1;
          const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
          // Drive docking off the LIVE scroll position (the exact value the pins use),
          // recomputed every render frame — smoother than the rAF-throttled progressRef
          // and, crucially, CONTINUOUS with the pins: the cinematic spans are driven
          // directly (no damping) from this same value, so the moon reaches each dock
          // exactly in step with scroll and the pin takes over with nothing to catch up
          // to → a smooth landing, not a snap.
          const pd = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : p;
          const dMan = docksRef ? docksRef.current.man : P_DOCK_MAN;
          const dBuy = docksRef ? docksRef.current.buy : P_DOCK_BUY;
          const hideStart = dMan + HIDE_PAD_START;
          const hideEnd = dBuy - HIDE_PAD_END;
          const dockedR = PIN_S * MOON_RADIUS;
          const maxOff = Math.max(0, halfW - dockedR - 0.12);
          const xMan = Math.min(PIN_X_MAN, maxOff);
          const xBuy = Math.max(PIN_X_BUY, -maxOff);

          const pinMan = pd >= dMan && pd < hideStart;
          const pinBuy = pd > hideEnd && pd <= dBuy;
          const hidden = pd >= hideStart && pd <= hideEnd;

          if (pinMan) {
            g.position.set(xMan, PIN_Y_MAN + (scrollY - dMan * max) * wpp, 0);
            g.scale.setScalar(PIN_S);
            g.visible = true;
          } else if (pinBuy) {
            g.position.set(xBuy, PIN_Y_BUY + (scrollY - dBuy * max) * wpp, 0);
            g.scale.setScalar(PIN_S);
            g.visible = true;
          } else if (hidden) {
            // teleport unseen from off-top to below-screen; snap (no streak)
            const m = sampleMoon(pd, dMan, dBuy, xMan, xBuy);
            g.position.set(m.x, m.y, 0);
            g.scale.setScalar(m.s);
            g.visible = false;
          } else {
            // cinematic travel (hero→manifesto, how-to-buy→footer): driven DIRECTLY
            // from the pure sampleMoon(pd) arc — scroll-locked exactly like the pins, so
            // the arc lands on the dock in step with scroll (no damping lag → no snap).
            const m = sampleMoon(pd, dMan, dBuy, xMan, xBuy);
            g.position.set(m.x, m.y, 0);
            g.scale.setScalar(m.s);
            g.visible = true;
          }
        }
        if (glowRef.current) glowRef.current.visible = g.visible;
      }
    }
    const phase = reduce ? 0 : Math.sin((t / GLOW_PERIOD) * Math.PI * 2);
    // Billboard the glow onto the moon's TRUE projected silhouette every frame, so
    // the ring stays perfectly concentric at any travel position/scale. A flat
    // plane parented to the moon diverges off-axis (a sphere's near-side limb
    // projects differently than a plane at its centre) → the moon pokes out one
    // side. Here: silhouette centre Pc = P + (C−P)·(R²/d²), radius ρ = R·√(1−R²/d²).
    if (glowRef.current && travelRef.current) {
      const gm = travelRef.current;
      _P.copy(gm.position); // moon world centre
      _C.copy(state.camera.position); // camera
      _CP.copy(_C).sub(_P); // moon → camera
      const d2 = _CP.lengthSq();
      const R = gm.scale.x * MOON_RADIUS; // moon world radius
      const k = (R * R) / d2;
      glowRef.current.position.copy(_P).addScaledVector(_CP, k);
      glowRef.current.lookAt(_C); // face the camera (billboard)
      const rho = R * Math.sqrt(Math.max(0, 1 - k)); // silhouette world radius
      glowRef.current.scale.setScalar(
        (rho / (0.5 * F_EDGE)) * (1 + phase * 0.01),
      );

      // Publish the moon's on-screen disc (px, canvas-relative) so the window-level
      // pointer listeners can hit-test a grab against it. The canvas is fixed and
      // full-viewport, so these pixels line up 1:1 with the pointer's client coords.
      if (moonScreenRef) {
        const cam = state.camera;
        const w = state.size.width;
        const h = state.size.height;
        // silhouette centre → NDC → pixels
        _EDGE.copy(glowRef.current.position).project(cam);
        const cx = (_EDGE.x * 0.5 + 0.5) * w;
        const cy = (-_EDGE.y * 0.5 + 0.5) * h;
        // a point on the silhouette rim (offset by rho along camera-right) → pixels
        _EDGE
          .setFromMatrixColumn(cam.matrixWorld, 0)
          .multiplyScalar(rho)
          .add(glowRef.current.position)
          .project(cam);
        const ex = (_EDGE.x * 0.5 + 0.5) * w;
        const ey = (-_EDGE.y * 0.5 + 0.5) * h;
        const ms = moonScreenRef.current;
        ms.x = cx;
        ms.y = cy;
        ms.r = Math.hypot(ex - cx, ey - cy);
        ms.visible = travelRef.current.visible;
      }
    } else if (moonScreenRef) {
      moonScreenRef.current.visible = false;
    }
    // gentle pulse only (no scroll-driven build) — all glow layers breathe together
    if (coronaMat.current) coronaMat.current.opacity = 0.9 + phase * 0.1;
    // very slow axial spin of ONLY the streamer corona plane (siblings stay fixed).
    // Parent glow group is billboarded via lookAt, so local z-rotation spins the
    // streamer around its own camera-facing axis.
    if (coronaMeshRef.current && !reduce)
      coronaMeshRef.current.rotation.z = t * 0.015;
    if (rimMat.current) rimMat.current.opacity = 0.92 + phase * 0.08;
    if (chromoMat.current) chromoMat.current.opacity = 0.85 + phase * 0.15;
    if (beadMat.current) beadMat.current.opacity = 0.85 + phase * 0.15;
  });

  return (
    <>
      <color attach="background" args={["#040302"]} />

      {/* procedural nebula — a soft ember band low in the frame, behind the moon.
          fBm baked to a texture at mount; runtime cost ≈ the grain quad. */}
      <Nebula
        reduce={reduce}
        progressRef={progressRef}
        scrollMaxRef={scrollMaxRef}
      />

      <ambientLight intensity={0.13} />
      {/* warm sun behind the moon → bright ember rim on the disc */}
      <directionalLight
        position={[0.7, 0.3, -3]}
        intensity={2.6}
        color="#ffd9a6"
      />
      {/* cool moonlight from the front, angled so the bump reveals craters */}
      <directionalLight
        position={[-0.5, 0.6, 2.6]}
        intensity={0.66}
        color="#cfd4dd"
      />

      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.035}
          sizeAttenuation
          transparent
          opacity={0.68}
          depthWrite={false}
        />
      </points>

      {/* Glow lives at top level (NOT parented to the moon): each frame it is
          billboarded onto the moon's projected silhouette in useFrame, so it stays
          concentric with the moon at every travel position/scale. Unit planes;
          DoubleSide so the camera-facing billboard renders regardless of flip. */}
      <group ref={glowRef}>
        {/* streamer corona — its own LARGER plane (CORONA_REACH) so filaments reach out */}
        <mesh ref={coronaMeshRef} scale={CORONA_REACH}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={coronaMat}
            map={coronaTex}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        {/* thin red-orange chromosphere + prominences, tight to the limb */}
        <mesh>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={chromoMat}
            map={chromoTex}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        {/* white-hot limb ring */}
        <mesh>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={rimMat}
            map={rimTex}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        {/* diamond-ring / Baily's bead — one brilliant point on the sun-facing rim.
            Sits at the moon's edge (local radius 0.5·F_EDGE) at DIAMOND_ANGLE; billboards
            with the group. Independent of moon spin (it's where the sun peeks past). */}
        <mesh
          position={[
            0.5 * F_EDGE * Math.cos(DIAMOND_ANGLE),
            0.5 * F_EDGE * Math.sin(DIAMOND_ANGLE),
            0.002,
          ]}
          scale={DIAMOND_SIZE * 0.9}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={beadMat}
            map={beadTex}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>

      <group ref={travelRef}>
        {/* grab-to-spin globe: rotation is applied to this mesh on world axes */}
        <mesh ref={moonRef}>
          <sphereGeometry args={[MOON_RADIUS, 48, 48]} />
          {/* Phong is much cheaper than Standard PBR on integrated GPUs;
              matte (no specular), displacement for silhouette relief. */}
          <meshPhongMaterial
            map={colorMap}
            bumpMap={bumpMap}
            bumpScale={0.04}
            displacementMap={bumpMap}
            displacementScale={0.02}
            shininess={2}
            specular="#000000"
            color="#7e746a"
          />
        </mesh>
      </group>

      {/* film grain over the whole backdrop, drawn last */}
      <Grain reduce={reduce} />
    </>
  );
}
