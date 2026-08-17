"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * In-canvas procedural nebula — a soft ember dust band drifting low in the frame,
 * like a distant galactic arm. Sits BEHIND the moon: the quad is a fullscreen
 * clip-space plane pushed to the FAR depth (vertex z ≈ 0.999) WITH depthTest on,
 * so the opaque moon (which writes depth) occludes it via the depth buffer. (A
 * transparent quad always draws after the opaque pass, so depthTest — not
 * renderOrder — is what puts it behind the moon.) Stars/glow/grain still paint
 * over it; the rest of the sky stays black.
 *
 * PERF: the fBm cloud is BAKED ONCE into a tileable texture at mount (the
 * `makeNebulaTex` canvas below) — computing 3-call/4-octave fBm per pixel EVERY
 * frame halved the framerate on the Intel UHD 630. At runtime the fragment shader
 * only does: an early-out on the cheap gaussian band mask (the ~2/3 of the screen
 * outside the band pays almost nothing), one texture fetch of the pre-baked cloud
 * (slowly panned + a tiny sin ripple for the "slow drift"), and the colour map.
 * Cost is now ≈ the grain quad. The texture wraps (RepeatWrapping, tileable in
 * both axes) so the pan drifts forever without a seam.
 *
 * Colour maps a dark indigo/plum trough → warm ember → corona ridge ("ember +
 * cool depth"). NormalBlending (not additive) lets the cool plum read as depth
 * rather than just added light. Frozen under reduced motion.
 */

/* -------- bake a tileable fBm cloud into a luminance texture (once) --------- */
function makeNebulaTex(size = 256, period = 8): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);

  const frac = (x: number) => x - Math.floor(x);
  // hash on an INTEGER lattice wrapped to `per` → the noise tiles seamlessly
  const hash = (ix: number, iy: number, per: number) => {
    const x = ((ix % per) + per) % per;
    const y = ((iy % per) + per) % per;
    return frac(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
  };
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const vnoise = (x: number, y: number, per: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = smooth(x - xi);
    const v = smooth(y - yi);
    const a = hash(xi, yi, per);
    const b = hash(xi + 1, yi, per);
    const cc = hash(xi, yi + 1, per);
    const d = hash(xi + 1, yi + 1, per);
    return lerp(lerp(a, b, u), lerp(cc, d, u), v);
  };
  const fbm = (x: number, y: number) => {
    let sum = 0;
    let amp = 0.5;
    let f = 1;
    // period doubles with frequency so every octave stays exactly tileable
    for (let o = 0; o < 4; o++) {
      sum += amp * vnoise(x * f, y * f, period * f);
      amp *= 0.5;
      f *= 2;
    }
    return sum;
  };

  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const n = fbm((i / size) * period, (j / size) * period);
      const idx = (j * size + i) * 4;
      const v = Math.max(0, Math.min(255, n * 255));
      img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = v;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace; // luminance data, not colour
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform sampler2D uCloud;
  uniform float uBandY; // screen-space p.y of the band centre; scroll-driven so
                        // the band is anchored to a DOCUMENT position (~20% down)
                        // and scrolls up/off with the page instead of being fixed

  // ---- brand palette (sRGB values of the umbra tokens) ----
  const vec3 PLUM   = vec3(0.10, 0.08, 0.15); // dark indigo — trough depth
  const vec3 EMBER  = vec3(0.78, 0.47, 0.25); // --ember  #c87740
  const vec3 CORONA = vec3(0.96, 0.68, 0.42); // --corona #f4ae6a — hottest ridge
  const float MASTER_ALPHA = 0.32;            // subtle (black dominates)

  void main() {
    // aspect-corrected coords centred at 0, so the band angle is stable across
    // viewport ratios (x stretched by aspect; y in −0.5..0.5)
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

    // PERF: cheap band mask first → bail out on every pixel outside the band
    // BEFORE the texture fetch + colour work. The centre rides uBandY (scroll-
    // driven), so as soon as the band scrolls off-screen every pixel early-outs.
    float line = uBandY + p.x * 0.13;             // gentle slope, scroll-anchored
    float band = exp(-pow((p.y - line) / 0.24, 2.0));
    if (band < 0.012) { gl_FragColor = vec4(0.0); return; }

    float t = mod(uTime, 1000.0); // bounded → never overflows highp

    // sample the pre-baked tileable cloud. Coords are taken RELATIVE to the band
    // centre (p.y − uBandY) so the cloud pattern is painted onto the band and
    // travels 1:1 with it up the page — the nebula reads as one drifting object,
    // not a fixed texture the envelope slides over. Plus a slow time pan (drift)
    // and a tiny sin ripple (churn); the tex wraps so the pan is seamless.
    vec2 cuv = vec2(p.x, p.y - uBandY) * 0.6;
    cuv += vec2(t * 0.006, t * 0.0015);
    cuv += 0.03 * vec2(sin(p.y * 3.0 + t * 0.3), cos(p.x * 3.0 + t * 0.25));
    float cloud = texture2D(uCloud, cuv).r;

    float density = clamp(cloud * band * 1.6 - 0.25, 0.0, 1.0);

    // colour: plum trough → ember → corona ridge
    vec3 col = mix(PLUM, EMBER, smoothstep(0.0, 0.6, density));
    col = mix(col, CORONA, smoothstep(0.55, 1.0, density));

    // alpha rides density (troughs fade to ~0 so black shows through)
    float alpha = smoothstep(0.04, 0.85, density) * MASTER_ALPHA;
    gl_FragColor = vec4(col, alpha);
  }
`;

// Document position the band is anchored to, as a fraction of total page height.
// The band lives at ~20% down the page and scrolls up/off with the content.
const NEBULA_ANCHOR = 0.15;

export default function Nebula({
  reduce,
  progressRef,
  scrollMaxRef,
}: {
  reduce: boolean;
  progressRef?: { current: number };
  scrollMaxRef?: { current: number };
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const cloudTex = useMemo(() => makeNebulaTex(), []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uCloud: { value: cloudTex },
      uBandY: { value: -0.22 },
    }),
    [cloudTex],
  );

  useFrame((state) => {
    // Mutate THROUGH the material ref's .current — the React-19-lint-safe hatch.
    const m = matRef.current;
    if (!m) return;
    const dpr = state.viewport.dpr;
    m.uniforms.uResolution.value.set(
      state.size.width * dpr,
      state.size.height * dpr,
    );
    if (!reduce) m.uniforms.uTime.value = state.clock.elapsedTime;

    // Anchor the band to a DOCUMENT position (~20% down the page) and convert it
    // to screen-space p.y each frame, so the band scrolls up and off with the
    // content instead of being pinned to the viewport. The canvas is fixed and
    // full-viewport, so state.size.height is the viewport height in CSS px.
    // p.y is +0.5 at the top of the screen, −0.5 at the bottom.
    const vh = state.size.height;
    const scrollMax = scrollMaxRef ? scrollMaxRef.current : 0;
    const scrollY = (progressRef ? progressRef.current : 0) * scrollMax;
    const pageHeight = scrollMax + vh;
    const bandDocY = NEBULA_ANCHOR * pageHeight; // px from document top
    const fracFromTop = (bandDocY - scrollY) / vh; // 0 = screen top, 1 = bottom
    m.uniforms.uBandY.value = 0.5 - fracFromTop;
  });

  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthTest={true}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}
